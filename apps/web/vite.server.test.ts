import { afterEach, describe, expect, it, vi } from 'vitest';

import { readServerOptions } from './vite.server.ts';

const TEST_MODE = 'test';
const PORT = 5199;
const FIRST_HOST = '.first.example';
const SECOND_HOST = 'second.example';

describe('readServerOptions', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('reads the port and the allowed hosts from the environment', () => {
    vi.stubEnv('WEB_PORT', String(PORT));
    vi.stubEnv('WEB_ALLOWED_HOSTS', `${FIRST_HOST}, ${SECOND_HOST}`);

    expect(readServerOptions(TEST_MODE)).toEqual({
      host: true,
      port: PORT,
      strictPort: true,
      allowedHosts: [FIRST_HOST, SECOND_HOST],
    });
  });

  it('fails when the port is not configured', () => {
    vi.stubEnv('WEB_PORT', undefined);
    vi.stubEnv('WEB_ALLOWED_HOSTS', FIRST_HOST);

    expect(() => readServerOptions(TEST_MODE)).toThrow(/WEB_PORT/);
  });

  it('fails when an allowed host is empty', () => {
    vi.stubEnv('WEB_PORT', String(PORT));
    vi.stubEnv('WEB_ALLOWED_HOSTS', `${FIRST_HOST},`);

    expect(() => readServerOptions(TEST_MODE)).toThrow(/WEB_ALLOWED_HOSTS/);
  });
});
