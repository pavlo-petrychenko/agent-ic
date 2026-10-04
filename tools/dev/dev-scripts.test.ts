import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, it } from 'node:test';

const TEMP_PREFIX = 'dev-scripts-';
const ENV_SCRIPT = 'tools/dev/env.sh';
const HOSTS_SCRIPT = 'tools/dev/hosts.sh';
const ENV_COMMAND = 'env';
const LOCAL_HOSTS = [
  'local.agent-ic.pavlop.dev',
  'mail.local.agent-ic.pavlop.dev',
  's3.local.agent-ic.pavlop.dev',
  'grafana.local.agent-ic.pavlop.dev',
  'langfuse.local.agent-ic.pavlop.dev',
  'queues.local.agent-ic.pavlop.dev',
];

let dir = '';

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), TEMP_PREFIX));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

const run = (script: string, env: Record<string, string>): string =>
  execFileSync(
    ENV_COMMAND,
    [...Object.entries(env).map(([name, value]) => `${name}=${value}`), script],
    { encoding: 'utf8' },
  );

const envPaths = (): { ENV_FILE: string; ENV_EXAMPLE_FILE: string } => ({
  ENV_FILE: join(dir, '.env'),
  ENV_EXAMPLE_FILE: join(dir, '.env.example'),
});

void it('creates .env from .env.example when it is missing', () => {
  const paths = envPaths();
  writeFileSync(paths.ENV_EXAMPLE_FILE, 'A=1\nB=2\n');

  run(ENV_SCRIPT, paths);

  assert.equal(readFileSync(paths.ENV_FILE, 'utf8'), 'A=1\nB=2\n');
});

void it('appends only the variables missing from .env and keeps local values', () => {
  const paths = envPaths();
  writeFileSync(paths.ENV_EXAMPLE_FILE, '# ports\nA=1\n\nB=2\nC=has=equals\n');
  writeFileSync(paths.ENV_FILE, 'A=local');

  const output = run(ENV_SCRIPT, paths);

  assert.equal(readFileSync(paths.ENV_FILE, 'utf8'), 'A=local\nB=2\nC=has=equals\n');
  assert.match(output, /added B C/);
});

void it('leaves a complete .env unchanged', () => {
  const paths = envPaths();
  writeFileSync(paths.ENV_EXAMPLE_FILE, 'A=1\n');
  writeFileSync(paths.ENV_FILE, 'A=2\n');

  run(ENV_SCRIPT, paths);

  assert.equal(readFileSync(paths.ENV_FILE, 'utf8'), 'A=2\n');
});

void it('adds only the missing local hostnames to the hosts file', () => {
  const hostsFile = join(dir, 'hosts');
  writeFileSync(hostsFile, `127.0.0.1 localhost\n127.0.0.1 ${LOCAL_HOSTS[0]}\n`);

  run(HOSTS_SCRIPT, { HOSTS_FILE: hostsFile });
  run(HOSTS_SCRIPT, { HOSTS_FILE: hostsFile });

  const lines = readFileSync(hostsFile, 'utf8').trim().split('\n');
  assert.deepEqual(lines.slice(2), [`127.0.0.1 ${LOCAL_HOSTS.slice(1).join(' ')}`]);
});
