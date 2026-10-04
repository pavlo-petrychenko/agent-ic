import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import {
  ENV_ASSIGNMENT,
  ENV_COMMENT,
  ENV_EXAMPLE_FILE,
  ENV_FILE,
  LINE_BREAK,
  LINE_BREAK_PATTERN,
} from './dev.constants.ts';
import type { EnvValues } from './dev.typedefs.ts';

const envKey = (line: string): string | null => {
  const trimmed = line.trim();
  if (trimmed === '' || trimmed.startsWith(ENV_COMMENT)) {
    return null;
  }
  const index = line.indexOf(ENV_ASSIGNMENT);
  return index > 0 ? line.slice(0, index) : null;
};

export const parseEnv = (content: string): EnvValues => {
  const values = new Map<string, string>();
  for (const line of content.split(LINE_BREAK_PATTERN)) {
    const key = envKey(line);
    if (key !== null) {
      values.set(key, line.slice(key.length + ENV_ASSIGNMENT.length));
    }
  }
  return values;
};

export const missingEnvLines = (env: string, example: string): readonly string[] => {
  const present = parseEnv(env);
  return example.split(LINE_BREAK_PATTERN).filter((line) => {
    const key = envKey(line);
    return key !== null && !present.has(key);
  });
};

export const appendLines = (content: string, lines: readonly string[]): string => {
  if (lines.length === 0) {
    return content;
  }
  const separator = content === '' || content.endsWith(LINE_BREAK) ? '' : LINE_BREAK;
  return `${content}${separator}${lines.join(LINE_BREAK)}${LINE_BREAK}`;
};

export const setEnvValue = (content: string, key: string, value: string): string => {
  const assignment = `${key}${ENV_ASSIGNMENT}${value}`;
  const lines = content.split(LINE_BREAK);
  if (!lines.some((line) => envKey(line) === key)) {
    return appendLines(content, [assignment]);
  }
  return lines.map((line) => (envKey(line) === key ? assignment : line)).join(LINE_BREAK);
};

export const readEnvFile = (path: string = ENV_FILE): EnvValues =>
  parseEnv(readFileSync(path, 'utf8'));

export const writeEnvValue = (key: string, value: string, path: string = ENV_FILE): void => {
  writeFileSync(path, setEnvValue(readFileSync(path, 'utf8'), key, value));
};

export const syncEnvFile = (
  envPath: string = ENV_FILE,
  examplePath: string = ENV_EXAMPLE_FILE,
): readonly string[] | null => {
  if (!existsSync(envPath)) {
    copyFileSync(examplePath, envPath);
    return null;
  }
  const content = readFileSync(envPath, 'utf8');
  const missing = missingEnvLines(content, readFileSync(examplePath, 'utf8'));
  writeFileSync(envPath, appendLines(content, missing));
  return missing.map((line) => line.slice(0, line.indexOf(ENV_ASSIGNMENT)));
};
