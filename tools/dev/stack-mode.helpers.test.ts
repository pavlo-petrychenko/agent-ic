import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, it } from 'node:test';
import { StackMode } from './dev.constants.ts';
import {
  composeFileArgs,
  modeProfileArgs,
  observabilityServices,
  parseStackMode,
  readStackMode,
  removeStackMode,
  resolveMode,
  writeStackMode,
} from './stack-mode.helpers.ts';

const TEMP_PREFIX = 'dev-stack-mode-';
const MODE_FILE = 'stack.mode';

let directory = '';

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), TEMP_PREFIX));
});

afterEach(() => {
  rmSync(directory, { recursive: true, force: true });
});

void it('parses a mode and falls back to lean for anything else', () => {
  assert.equal(parseStackMode('observability\n'), StackMode.Observability);
  assert.equal(parseStackMode('lean'), StackMode.Lean);
  assert.equal(parseStackMode('other'), StackMode.Lean);
  assert.equal(parseStackMode(null), StackMode.Lean);
});

void it('reads lean when no mode file exists and round-trips a written mode', () => {
  const path = join(directory, 'nested', MODE_FILE);

  assert.equal(readStackMode(path), StackMode.Lean);

  writeStackMode(StackMode.Observability, path);
  assert.equal(readStackMode(path), StackMode.Observability);

  removeStackMode(path);
  assert.equal(readStackMode(path), StackMode.Lean);
});

void it('adds the overlay and the profile only in observability mode', () => {
  assert.deepEqual(composeFileArgs(StackMode.Lean), []);
  assert.deepEqual(composeFileArgs(StackMode.Observability), [
    '-f',
    'compose.yaml',
    '-f',
    'compose.observability.yaml',
  ]);
  assert.deepEqual(modeProfileArgs(StackMode.Lean), []);
  assert.deepEqual(modeProfileArgs(StackMode.Observability), ['--profile', 'observability']);
});

void it('switches mode on a full start and keeps it on a start of listed services', () => {
  assert.equal(resolveMode(StackMode.Lean, [], StackMode.Observability), StackMode.Lean);
  assert.equal(
    resolveMode(StackMode.Lean, ['api'], StackMode.Observability),
    StackMode.Observability,
  );
  assert.equal(resolveMode(StackMode.Lean, ['api'], StackMode.Lean), StackMode.Lean);
  assert.equal(
    resolveMode(StackMode.Observability, ['api'], StackMode.Lean),
    StackMode.Observability,
  );
  assert.equal(resolveMode(StackMode.Observability, [], StackMode.Lean), StackMode.Observability);
});

void it('lists the services that only the observability profile adds', () => {
  const all = 'postgres\nredis\napi\ntempo\nloki\nalloy\n';
  const lean = 'postgres\nredis\napi\n';

  assert.deepEqual(observabilityServices(all, lean), ['tempo', 'loki', 'alloy']);
  assert.deepEqual(observabilityServices(lean, lean), []);
  assert.deepEqual(observabilityServices('', ''), []);
});
