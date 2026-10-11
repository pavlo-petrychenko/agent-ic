import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import {
  FINGERPRINT_FILE,
  FINGERPRINT_HASH,
  FINGERPRINT_PATHSPECS,
  FINGERPRINT_VOLUMES,
  LABEL_SEPARATOR,
  LINE_BREAK_PATTERN,
  NODE_SERVICES,
  NUL,
  RUNNING_STATE,
  Tool,
  UNHEALTHY,
  VOLUME_NAME_SEPARATOR,
  WORKING_DIR_LABEL,
} from './dev.constants.ts';
import type { ContainerStatus } from './dev.typedefs.ts';
import { capture } from './platform.helpers.ts';

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const textField = (record: Readonly<Record<string, unknown>>, key: string): string => {
  const value = record[key];
  return typeof value === 'string' ? value : '';
};

export const digest = (parts: readonly string[]): string =>
  createHash(FINGERPRINT_HASH).update(parts.join(NUL)).digest('hex');

export const splitNul = (output: string): readonly string[] =>
  output.split(NUL).filter((entry) => entry !== '');

const labelValue = (labels: string, name: string): string | null => {
  const prefix = `${name}=`;
  const label = labels.split(LABEL_SEPARATOR).find((entry) => entry.startsWith(prefix));
  return label === undefined ? null : label.slice(prefix.length);
};

const toContainer = (value: unknown): ContainerStatus | null =>
  isRecord(value)
    ? {
        service: textField(value, 'Service'),
        state: textField(value, 'State'),
        health: textField(value, 'Health'),
        workingDir: labelValue(textField(value, 'Labels'), WORKING_DIR_LABEL),
      }
    : null;

export const parseContainers = (output: string): readonly ContainerStatus[] => {
  const trimmed = output.trim();
  const values: readonly unknown[] = trimmed.startsWith('[')
    ? [JSON.parse(trimmed)].flat()
    : trimmed
        .split(LINE_BREAK_PATTERN)
        .filter((line) => line !== '')
        .map((line): unknown => JSON.parse(line));
  return values.map(toContainer).filter((container) => container !== null);
};

export const otherCheckouts = (
  containers: readonly ContainerStatus[],
  checkout: string,
): readonly string[] => [
  ...new Set(
    containers.flatMap(({ workingDir }) =>
      workingDir === null || workingDir === checkout ? [] : [workingDir],
    ),
  ),
];

export const servicesToRestart = (
  changed: boolean,
  containers: readonly ContainerStatus[],
): readonly string[] =>
  containers
    .filter(
      ({ service, state, health }) =>
        NODE_SERVICES.includes(service) &&
        state === RUNNING_STATE &&
        (changed || health === UNHEALTHY),
    )
    .map(({ service }) => service);

export const projectName = (config: string): string | null => {
  const parsed: unknown = JSON.parse(config);
  return isRecord(parsed) && typeof parsed.name === 'string' ? parsed.name : null;
};

const fileDigest = (path: string): string =>
  `${path}${NUL}${existsSync(path) ? digest([readFileSync(path, 'utf8')]) : ''}`;

const volumeCreatedAt = (project: string, volume: string): string =>
  capture(Tool.Docker, [
    'volume',
    'inspect',
    '--format',
    '{{.CreatedAt}}',
    `${project}${VOLUME_NAME_SEPARATOR}${volume}`,
  ]) ?? '';

export const stackContainers = (): readonly ContainerStatus[] =>
  parseContainers(capture(Tool.Docker, ['compose', 'ps', '--all', '--format', 'json']) ?? '');

export const stackFingerprint = (): string | null => {
  const head = capture(Tool.Git, ['rev-parse', 'HEAD']);
  const files = capture(Tool.Git, [
    'ls-files',
    '-z',
    '--cached',
    '--others',
    '--exclude-standard',
    '--',
    ...FINGERPRINT_PATHSPECS,
  ]);
  const config = capture(Tool.Docker, ['compose', 'config', '--format', 'json']);
  const project = config === null ? null : projectName(config);
  if (head === null || files === null || project === null) {
    return null;
  }
  return digest([
    head,
    ...splitNul(files).map(fileDigest),
    ...FINGERPRINT_VOLUMES.map((volume) => volumeCreatedAt(project, volume)),
  ]);
};

export const readFingerprint = (path: string = FINGERPRINT_FILE): string | null =>
  existsSync(path) ? readFileSync(path, 'utf8').trim() : null;

export const writeFingerprint = (fingerprint: string, path: string = FINGERPRINT_FILE): void => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, fingerprint);
};
