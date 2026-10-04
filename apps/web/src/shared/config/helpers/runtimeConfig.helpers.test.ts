import { afterEach, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';
import { AppError } from '@/shared/api/errors/app.error';
import { loadRuntimeConfig } from '@/shared/config/helpers/runtimeConfig.helpers';

const respondWith = (body: unknown, status = 200) => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status })));
};

describe('loadRuntimeConfig', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the validated config', async () => {
    respondWith({ graphqlPath: '/api/graphql' });

    await expect(loadRuntimeConfig()).resolves.toEqual({ graphqlPath: '/api/graphql' });
  });

  it('refuses a config that does not match the schema', async () => {
    respondWith({ graphqlPath: 'api/graphql' });

    await expect(loadRuntimeConfig()).rejects.toBeInstanceOf(ZodError);
  });

  it('fails when the config file cannot be fetched', async () => {
    respondWith({}, 404);

    await expect(loadRuntimeConfig()).rejects.toBeInstanceOf(AppError);
  });
});
