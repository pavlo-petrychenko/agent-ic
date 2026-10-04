import { randomUUID } from 'node:crypto';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { CacheModule } from '@/platform/cache/cache.module';
import { defineCacheEntry } from '@/platform/cache/helpers/cache.helpers';
import { CacheService } from '@/platform/cache/services/cache.service';
import { RedisModule } from '@/platform/redis/redis.module';
import { CacheRedisService } from '@/platform/redis/services/cache-redis.service';
import { TestRedisDatabase } from '@test/support/constants/test-infrastructure.constants';
import { createPlatformTestingModule } from '@test/support/helpers/database-testing.helpers';

const TTL_SECONDS = 60;

const profileSchema = z.object({ name: z.string(), visits: z.number() });

type Profile = z.infer<typeof profileSchema>;

const profileEntry = defineCacheEntry({
  name: 'test-profile',
  schema: profileSchema,
  ttlSeconds: TTL_SECONDS,
});

const PROFILE: Profile = { name: 'Ada', visits: 3 };

describe('CacheService', () => {
  let testingModule: TestingModule;
  let cache: CacheService;
  let redis: CacheRedisService;

  beforeAll(async () => {
    testingModule = await createPlatformTestingModule(TestRedisDatabase.Cache, [
      RedisModule,
      CacheModule,
    ]);
    cache = testingModule.get(CacheService);
    redis = testingModule.get(CacheRedisService);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  it('returns null for a missing entry', async () => {
    expect(await cache.get(profileEntry(randomUUID()))).toBeNull();
  });

  it('stores a value with the entry ttl', async () => {
    const entry = profileEntry(randomUUID());

    await cache.set(entry, PROFILE);

    expect(await cache.get(entry)).toEqual(PROFILE);
    const ttl = await redis.connection.ttl(entry.key);
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(TTL_SECONDS);
  });

  it('deletes an entry', async () => {
    const entry = profileEntry(randomUUID());
    await cache.set(entry, PROFILE);

    await cache.delete(entry);

    expect(await cache.get(entry)).toBeNull();
  });

  it('loads a missing value once and serves it from the cache after', async () => {
    const entry = profileEntry(randomUUID());
    const load = vi.fn<() => Promise<Profile>>(() => Promise.resolve(PROFILE));

    const first = await cache.getOrLoad(entry, load);
    const second = await cache.getOrLoad(entry, load);

    expect(first).toEqual(PROFILE);
    expect(second).toEqual(PROFILE);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('treats a value of another shape as missing', async () => {
    const entry = profileEntry(randomUUID());
    await redis.connection.set(entry.key, JSON.stringify({ name: 1 }));

    expect(await cache.get(entry)).toBeNull();
  });

  it('treats a value that is not JSON as missing', async () => {
    const entry = profileEntry(randomUUID());
    await redis.connection.set(entry.key, '{not json');

    expect(await cache.get(entry)).toBeNull();
  });
});
