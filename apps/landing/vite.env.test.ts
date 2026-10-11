import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import { readLandingEnv } from './vite.env.ts';

const TEST_MODE = 'test';
const EMPTY_ENV_DIRECTORY = mkdtempSync(join(tmpdir(), 'landing-env-'));

describe('readLandingEnv', () => {
  afterEach(() => vi.unstubAllEnvs());
  afterAll(() => rmSync(EMPTY_ENV_DIRECTORY, { recursive: true, force: true }));

  it('reads both origins without a trailing slash', () => {
    vi.stubEnv('LANDING_APP_URL', 'https://app.example/');
    vi.stubEnv('LANDING_SITE_URL', 'https://site.example');

    expect(readLandingEnv(TEST_MODE, EMPTY_ENV_DIRECTORY)).toEqual({
      LANDING_APP_URL: 'https://app.example',
      LANDING_SITE_URL: 'https://site.example',
    });
  });

  it('fails when the app URL is missing or not a web address', () => {
    vi.stubEnv('LANDING_SITE_URL', 'https://site.example');
    vi.stubEnv('LANDING_APP_URL', undefined);
    expect(() => readLandingEnv(TEST_MODE, EMPTY_ENV_DIRECTORY)).toThrow(/LANDING_APP_URL/);

    vi.stubEnv('LANDING_APP_URL', 'ftp://app.example');
    expect(() => readLandingEnv(TEST_MODE, EMPTY_ENV_DIRECTORY)).toThrow(/LANDING_APP_URL/);
  });
});
