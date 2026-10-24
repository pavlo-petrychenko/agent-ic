import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import {
  COMPOSE_FILE,
  LINE_BREAK_PATTERN,
  OBSERVABILITY_OVERLAY_FILE,
  OBSERVABILITY_PROFILE,
  STACK_MODE_FILE,
  StackMode,
} from './dev.constants.ts';
import type { CommandArgs, StackModeName } from './dev.typedefs.ts';

const FILE_FLAG = '-f';
const PROFILE_FLAG = '--profile';

export const parseStackMode = (value: string | null): StackModeName =>
  value?.trim() === StackMode.Observability ? StackMode.Observability : StackMode.Lean;

export const readStackMode = (path: string = STACK_MODE_FILE): StackModeName =>
  parseStackMode(existsSync(path) ? readFileSync(path, 'utf8') : null);

export const writeStackMode = (mode: StackModeName, path: string = STACK_MODE_FILE): void => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, mode);
};

export const removeStackMode = (path: string = STACK_MODE_FILE): void => {
  rmSync(path, { force: true });
};

export const composeFileArgs = (mode: StackModeName): CommandArgs =>
  mode === StackMode.Observability
    ? [FILE_FLAG, COMPOSE_FILE, FILE_FLAG, OBSERVABILITY_OVERLAY_FILE]
    : [];

export const modeProfileArgs = (mode: StackModeName): CommandArgs =>
  mode === StackMode.Observability ? [PROFILE_FLAG, OBSERVABILITY_PROFILE] : [];

export const resolveMode = (
  requested: StackModeName,
  services: CommandArgs,
  current: StackModeName,
): StackModeName =>
  requested === StackMode.Observability || services.length === 0 ? requested : current;

export const observabilityServices = (all: string, lean: string): readonly string[] => {
  const leanServices = new Set(lean.split(LINE_BREAK_PATTERN));
  return all
    .split(LINE_BREAK_PATTERN)
    .filter((service) => service !== '' && !leanServices.has(service));
};
