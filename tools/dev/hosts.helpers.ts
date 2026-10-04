import { accessSync, appendFileSync, constants, readFileSync } from 'node:fs';
import {
  ENV_COMMENT,
  EXIT_FAILURE,
  EXIT_SUCCESS,
  LINE_BREAK_PATTERN,
  LOCAL_HOSTNAMES,
  LOOPBACK_ADDRESS,
  Tool,
  UNIX_HOSTS_FILE,
  WHITESPACE_PATTERN,
  WINDOWS_HOSTS_SUFFIX,
} from './dev.constants.ts';
import { appendLines } from './env.helpers.ts';
import {
  isWindows,
  isWsl,
  log,
  logError,
  powershell,
  runElevatedPowershell,
  runWithInput,
  toWslPath,
} from './platform.helpers.ts';

export const missingHostnames = (content: string, hostnames: readonly string[]): string[] => {
  const mapped = content
    .split(LINE_BREAK_PATTERN)
    .flatMap((line) =>
      (line.split(ENV_COMMENT)[0] ?? '').trim().split(WHITESPACE_PATTERN).slice(1),
    );
  return hostnames.filter((hostname) => !mapped.includes(hostname));
};

export const hostsLine = (hostnames: readonly string[]): string =>
  [LOOPBACK_ADDRESS, ...hostnames].join(' ');

const isWritable = (path: string): boolean => {
  try {
    accessSync(path, constants.W_OK);
    return true;
  } catch {
    return false;
  }
};

export const ensureUnixHosts = (path: string = UNIX_HOSTS_FILE): number => {
  const content = readFileSync(path, 'utf8');
  const missing = missingHostnames(content, LOCAL_HOSTNAMES);
  if (missing.length === 0) {
    log(`hosts: all entries already present in ${path}`);
    return EXIT_SUCCESS;
  }
  const line = hostsLine(missing);
  const addition = appendLines(content, [line]).slice(content.length);
  log(`hosts: adding ${line} to ${path}`);
  if (isWritable(path)) {
    appendFileSync(path, addition);
    return EXIT_SUCCESS;
  }
  return runWithInput(Tool.Sudo, ['tee', '-a', path], addition);
};

const windowsHostsPath = (): string | null => {
  const systemDirectory = powershell('[Environment]::SystemDirectory');
  return systemDirectory === null ? null : `${systemDirectory}${WINDOWS_HOSTS_SUFFIX}`;
};

const readableHostsPath = (windowsPath: string): string | null =>
  isWsl() ? toWslPath(windowsPath) : windowsPath;

export const ensureWindowsHosts = (): number => {
  const windowsPath = windowsHostsPath();
  const path = windowsPath === null ? null : readableHostsPath(windowsPath);
  if (windowsPath === null || path === null) {
    logError('hosts: could not find the Windows hosts file');
    return EXIT_FAILURE;
  }
  const missing = missingHostnames(readFileSync(path, 'utf8'), LOCAL_HOSTNAMES);
  if (missing.length === 0) {
    log('hosts: all entries already present in the Windows hosts file');
    return EXIT_SUCCESS;
  }
  const line = hostsLine(missing);
  log(`hosts: adding ${line} to ${windowsPath}, approve the administrator prompt`);
  runElevatedPowershell(
    `Add-Content -LiteralPath '${windowsPath}' -Value ([Environment]::NewLine + '${line}')`,
  );
  if (missingHostnames(readFileSync(path, 'utf8'), LOCAL_HOSTNAMES).length > 0) {
    logError(`hosts: ${windowsPath} was not changed; add this line to it as administrator:`);
    logError(`  ${line}`);
    return EXIT_FAILURE;
  }
  return EXIT_SUCCESS;
};

export const ensureHosts = (): number => {
  if (isWindows()) {
    return ensureWindowsHosts();
  }
  const status = ensureUnixHosts();
  return status === EXIT_SUCCESS && isWsl() ? ensureWindowsHosts() : status;
};
