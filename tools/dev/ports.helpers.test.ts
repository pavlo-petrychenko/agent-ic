import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:net';
import { it } from 'node:test';
import { LOOPBACK_ADDRESS } from './dev.constants.ts';
import type { PortBusyCheck } from './dev.typedefs.ts';
import { choosePorts, isPortBusy, publicUrl } from './ports.helpers.ts';

const ANY_FREE_PORT = 0;

const busyIn =
  (ports: readonly number[]): PortBusyCheck =>
  (port) =>
    Promise.resolve(ports.includes(port));

const listen = (): Promise<Server> =>
  new Promise((resolve) => {
    const server = createServer();
    server.listen(ANY_FREE_PORT, LOOPBACK_ADDRESS, () => {
      resolve(server);
    });
  });

void it('keeps free ports', async () => {
  const env = new Map([['A', '80']]);

  assert.deepEqual(await choosePorts(env, [{ name: 'A', fallback: 8080 }], busyIn([])), []);
});

void it('moves a busy port to the first free fallback that no other variable uses', async () => {
  const env = new Map([
    ['A', '80'],
    ['B', '8081'],
  ]);
  const variables = [
    { name: 'A', fallback: 8080 },
    { name: 'B', fallback: 9000 },
  ];

  assert.deepEqual(await choosePorts(env, variables, busyIn([80, 8080])), [
    { name: 'A', from: 80, to: 8082 },
  ]);
});

void it('detects a port another process listens on', async () => {
  const server = await listen();
  const address = server.address();
  const port = typeof address === 'object' && address !== null ? address.port : ANY_FREE_PORT;

  assert.equal(await isPortBusy(port), true);
  await new Promise((resolve) => server.close(resolve));
  assert.equal(await isPortBusy(port), false);
});

void it('adds the port to public URLs only when it is not 443', () => {
  assert.equal(publicUrl(443), 'https://local.agent-ic.pavlop.dev');
  assert.equal(publicUrl(8443, 'mail'), 'https://mail.local.agent-ic.pavlop.dev:8443');
});
