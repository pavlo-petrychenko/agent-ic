import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { platform, stderr, stdout } from 'node:process';
import {
  EXIT_FAILURE,
  EXIT_SUCCESS,
  LINE_BREAK,
  POWERSHELL,
  POWERSHELL_ENCODING,
  PROC_VERSION_FILE,
  Tool,
  WINDOWS_PLATFORM,
  WSL_KERNEL_PATTERN,
  WSLPATH,
} from './dev.constants.ts';
import type { CommandArgs, CommandStep } from './dev.typedefs.ts';

export const log = (message: string): void => {
  stdout.write(`${message}${LINE_BREAK}`);
};

export const logError = (message: string): void => {
  stderr.write(`${message}${LINE_BREAK}`);
};

export const isWindows = (): boolean => platform === WINDOWS_PLATFORM;

export const isWsl = (): boolean =>
  existsSync(PROC_VERSION_FILE) && WSL_KERNEL_PATTERN.test(readFileSync(PROC_VERSION_FILE, 'utf8'));

const needsShell = (command: string): boolean => isWindows() && command === Tool.Pnpm;

const statusOf = (command: string, result: SpawnSyncReturns<string | Buffer>): number => {
  if (result.error) {
    logError(`${command}: ${result.error.message}`);
  }
  return result.status ?? EXIT_FAILURE;
};

export const run = (command: string, args: CommandArgs = []): number =>
  statusOf(
    command,
    needsShell(command)
      ? spawnSync([command, ...args].join(' '), { shell: true, stdio: 'inherit' })
      : spawnSync(command, args, { stdio: 'inherit' }),
  );

export const runWithInput = (command: string, args: CommandArgs, input: string): number =>
  statusOf(command, spawnSync(command, args, { input, stdio: ['pipe', 'ignore', 'inherit'] }));

export const runStep = (step: CommandStep): number => run(step.command, step.args);

export const capture = (command: string, args: CommandArgs): string | null => {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  return result.status === EXIT_SUCCESS ? result.stdout.replaceAll('\r', '').trim() : null;
};

export const sequence = async (
  tasks: readonly (() => Promise<number> | number)[],
): Promise<number> => {
  for (const task of tasks) {
    const status = await task();
    if (status !== EXIT_SUCCESS) {
      return status;
    }
  }
  return EXIT_SUCCESS;
};

const encodePowershell = (script: string): string =>
  Buffer.from(script, POWERSHELL_ENCODING).toString('base64');

const powershellArgs = (script: string): CommandArgs => [
  '-NoProfile',
  '-NonInteractive',
  '-EncodedCommand',
  encodePowershell(script),
];

export const powershell = (script: string): string | null =>
  capture(POWERSHELL, powershellArgs(script));

export const runElevatedPowershell = (script: string): number =>
  run(
    POWERSHELL,
    powershellArgs(
      `Start-Process ${POWERSHELL} -Verb RunAs -Wait -ArgumentList '-NoProfile', '-EncodedCommand', '${encodePowershell(script)}'`,
    ),
  );

export const toWindowsPath = (path: string): string | null => capture(WSLPATH, ['-w', path]);

export const toWslPath = (path: string): string | null => capture(WSLPATH, ['-u', path]);
