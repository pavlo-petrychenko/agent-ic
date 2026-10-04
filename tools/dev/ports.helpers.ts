import { createServer } from 'node:net';
import {
  AddressError,
  ANY_ADDRESS,
  DEFAULT_HTTPS_PORT,
  HTTPS_SCHEME,
  LOCAL_DOMAIN,
  LOOPBACK_ADDRESS,
} from './dev.constants.ts';
import type { EnvValues, PortBusyCheck, PortChange, PortVariable } from './dev.typedefs.ts';
import { isWindows, isWsl, powershell } from './platform.helpers.ts';

const busyErrorCodes = (): readonly string[] =>
  isWindows() ? [AddressError.InUse, AddressError.Denied] : [AddressError.InUse];

const bindFails = (port: number, host: string): Promise<boolean> =>
  new Promise((resolve) => {
    const server = createServer();
    server.once('error', (error: NodeJS.ErrnoException) => {
      resolve(busyErrorCodes().includes(error.code ?? ''));
    });
    server.listen({ port, host, exclusive: true }, () => {
      server.close(() => {
        resolve(false);
      });
    });
  });

const listensOnWindows = (port: number): boolean =>
  Boolean(
    powershell(
      `Get-NetTCPConnection -State Listen -LocalPort ${port} -ErrorAction SilentlyContinue`,
    ),
  );

export const isPortBusy: PortBusyCheck = async (port) =>
  (await bindFails(port, LOOPBACK_ADDRESS)) ||
  (await bindFails(port, ANY_ADDRESS)) ||
  (isWsl() && listensOnWindows(port));

const freePort = async (
  candidate: number,
  used: ReadonlySet<number>,
  isBusy: PortBusyCheck,
): Promise<number> =>
  used.has(candidate) || (await isBusy(candidate))
    ? freePort(candidate + 1, used, isBusy)
    : candidate;

export const choosePorts = async (
  env: EnvValues,
  variables: readonly PortVariable[],
  isBusy: PortBusyCheck,
): Promise<readonly PortChange[]> => {
  const used = new Set(variables.map((variable) => Number(env.get(variable.name))));
  const changes: PortChange[] = [];
  for (const variable of variables) {
    const from = Number(env.get(variable.name));
    if (Number.isInteger(from) && (await isBusy(from))) {
      const to = await freePort(variable.fallback, used, isBusy);
      used.add(to);
      changes.push({ name: variable.name, from, to });
    }
  }
  return changes;
};

export const publicUrl = (httpsPort: number, subdomain: string | null = null): string => {
  const host = subdomain === null ? LOCAL_DOMAIN : `${subdomain}.${LOCAL_DOMAIN}`;
  const port = httpsPort === DEFAULT_HTTPS_PORT ? '' : `:${httpsPort}`;
  return `${HTTPS_SCHEME}${host}${port}`;
};
