import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, it } from 'node:test';
import { LOCAL_HOSTNAMES } from './dev.constants.ts';
import { ensureUnixHosts, hostsLine, missingHostnames } from './hosts.helpers.ts';

const TEMP_PREFIX = 'dev-hosts-';
const [FIRST_HOST = '', SECOND_HOST = ''] = LOCAL_HOSTNAMES;

let directory = '';

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), TEMP_PREFIX));
});

afterEach(() => {
  rmSync(directory, { recursive: true, force: true });
});

void it('ignores commented and partial matches', () => {
  const content = `# 127.0.0.1 ${FIRST_HOST}\r\n127.0.0.1 x${SECOND_HOST}\r\n`;

  assert.deepEqual(missingHostnames(content, [FIRST_HOST, SECOND_HOST]), [FIRST_HOST, SECOND_HOST]);
});

void it('finds hostnames mapped on any line', () => {
  const content = `127.0.0.1 localhost ${FIRST_HOST}\n::1 ${SECOND_HOST} # local\n`;

  assert.deepEqual(missingHostnames(content, [FIRST_HOST, SECOND_HOST]), []);
});

void it('adds only the missing local hostnames, once', () => {
  const hostsFile = join(directory, 'hosts');
  writeFileSync(hostsFile, `127.0.0.1 localhost\n127.0.0.1 ${FIRST_HOST}`);

  ensureUnixHosts(hostsFile);
  ensureUnixHosts(hostsFile);

  const lines = readFileSync(hostsFile, 'utf8').split('\n');
  assert.deepEqual(lines.slice(2), [hostsLine(LOCAL_HOSTNAMES.slice(1)), '']);
});
