import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, it } from 'node:test';
import { missingEnvLines, parseEnv, setEnvValue, syncEnvFile } from './env.helpers.ts';

const TEMP_PREFIX = 'dev-env-';

let directory = '';

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), TEMP_PREFIX));
});

afterEach(() => {
  rmSync(directory, { recursive: true, force: true });
});

void it('parses assignments, skips comments and keeps the last value', () => {
  const values = parseEnv('# ports\nA=1\r\n\nB=has=equals\nA=2\n');

  assert.deepEqual(
    [...values],
    [
      ['A', '2'],
      ['B', 'has=equals'],
    ],
  );
});

void it('lists only the example lines whose variable is missing', () => {
  assert.deepEqual(missingEnvLines('A=local\n', '# ports\nA=1\n\nB=2\nC=3\n'), ['B=2', 'C=3']);
});

void it('replaces a variable in place and appends a new one', () => {
  assert.equal(setEnvValue('A=1\nB=2\n', 'A', '9'), 'A=9\nB=2\n');
  assert.equal(setEnvValue('A=1', 'B', '2'), 'A=1\nB=2\n');
});

void it('creates .env from .env.example when it is missing', () => {
  const envPath = join(directory, '.env');
  const examplePath = join(directory, '.env.example');
  writeFileSync(examplePath, 'A=1\nB=2\n');

  assert.equal(syncEnvFile(envPath, examplePath), null);
  assert.equal(readFileSync(envPath, 'utf8'), 'A=1\nB=2\n');
});

void it('appends the missing variables and keeps local values', () => {
  const envPath = join(directory, '.env');
  const examplePath = join(directory, '.env.example');
  writeFileSync(examplePath, 'A=1\nB=2\nC=3\n');
  writeFileSync(envPath, 'A=local');

  assert.deepEqual(syncEnvFile(envPath, examplePath), ['B', 'C']);
  assert.equal(readFileSync(envPath, 'utf8'), 'A=local\nB=2\nC=3\n');
});
