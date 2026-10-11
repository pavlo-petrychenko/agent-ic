import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, it } from 'node:test';
import type { ContainerStatus } from './dev.typedefs.ts';
import {
  digest,
  otherCheckouts,
  parseContainers,
  projectName,
  readFingerprint,
  servicesToRestart,
  splitNul,
  writeFingerprint,
} from './start.helpers.ts';

const TEMP_PREFIX = 'dev-start-';
const CHECKOUT = '/repo';
const OTHER_CHECKOUT = '/repo/.claude/worktrees/other';

const container = (service: string, overrides: Partial<ContainerStatus> = {}): ContainerStatus => ({
  service,
  state: 'running',
  health: 'healthy',
  workingDir: CHECKOUT,
  ...overrides,
});

let directory = '';

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), TEMP_PREFIX));
});

afterEach(() => {
  rmSync(directory, { recursive: true, force: true });
});

void it('gives the same digest for the same parts and a new one when a part changes', () => {
  assert.equal(digest(['a', 'b']), digest(['a', 'b']));
  assert.notEqual(digest(['a', 'b']), digest(['a', 'c']));
  assert.notEqual(digest(['ab', '']), digest(['a', 'b']));
});

void it('splits NUL separated output and drops empty entries', () => {
  assert.deepEqual(splitNul('a.ts\0b dir/c.ts\0'), ['a.ts', 'b dir/c.ts']);
  assert.deepEqual(splitNul(''), []);
});

void it('reads containers from JSON lines and from a JSON array', () => {
  const api = {
    Service: 'api',
    State: 'running',
    Health: 'unhealthy',
    Labels: `com.docker.compose.depends_on=deps:x:false,postgres:y:false,com.docker.compose.project.working_dir=${CHECKOUT}`,
  };
  const deps = { Service: 'deps', State: 'exited', Health: '', Labels: '' };
  const expected = [
    { service: 'api', state: 'running', health: 'unhealthy', workingDir: CHECKOUT },
    { service: 'deps', state: 'exited', health: '', workingDir: null },
  ];

  assert.deepEqual(parseContainers(`${JSON.stringify(api)}\n${JSON.stringify(deps)}\n`), expected);
  assert.deepEqual(parseContainers(JSON.stringify([api, deps])), expected);
  assert.deepEqual(parseContainers(''), []);
});

void it('restarts every running node service when something changed', () => {
  const containers = [
    container('web'),
    container('api'),
    container('worker', { state: 'exited' }),
    container('postgres'),
  ];

  assert.deepEqual(servicesToRestart(true, containers), ['web', 'api']);
});

void it('restarts only unhealthy node services when nothing changed', () => {
  const containers = [
    container('web'),
    container('api', { health: 'unhealthy' }),
    container('redis', { health: 'unhealthy' }),
  ];

  assert.deepEqual(servicesToRestart(false, containers), ['api']);
});

void it('lists each other checkout the stack runs from once', () => {
  const containers = [
    container('web', { workingDir: OTHER_CHECKOUT }),
    container('api', { workingDir: OTHER_CHECKOUT }),
    container('postgres'),
    container('deps', { workingDir: null }),
  ];

  assert.deepEqual(otherCheckouts(containers, CHECKOUT), [OTHER_CHECKOUT]);
  assert.deepEqual(otherCheckouts(containers, OTHER_CHECKOUT), [CHECKOUT]);
});

void it('reads the project name from the compose config', () => {
  assert.equal(projectName('{"name":"agent-ic","services":{}}'), 'agent-ic');
  assert.equal(projectName('{"services":{}}'), null);
});

void it('stores the fingerprint and reads it back', () => {
  const path = join(directory, '.dev', 'start.fingerprint');

  assert.equal(readFingerprint(path), null);
  writeFingerprint('abc', path);
  assert.equal(readFingerprint(path), 'abc');
});
