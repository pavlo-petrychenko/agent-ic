import { randomUUID } from 'node:crypto';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { CacheEntry } from '@/platform/cache/cache.entry';
import { CacheModule } from '@/platform/cache/cache.module';
import { CacheService } from '@/platform/cache/cache.service';
import { CacheRedisClient } from '@/platform/redis/cache-redis.client';
import { RedisModule } from '@/platform/redis/redis.module';
import { TestRedisDatabase } from '@test/support/constants/test-infrastructure.constants';
import { createPlatformTestingModule } from '@test/support/helpers/database-testing.helpers';

const TTL_SECONDS = 60;

const profileSchema = z.object({ name: z.string(), visits: z.number() });

type Profile = z.infer<typeof profileSchema>;

class ProfileEntry extends CacheEntry<Profile> {
  protected readonly name = 'test-profile';
  readonly schema = profileSchema;
  readonly ttlSeconds = TTL_SECONDS;
}

const PROFILE: Profile = { name: 'Ada', visits: 3 };

describe('CacheService', () => {
  let testingModule: TestingModule;
  let cache: CacheService;
  let redis: CacheRedisClient;

  beforeAll(async () => {
    testingModule = await createPlatformTestingModule(TestRedisDatabase.Cache, [
      RedisModule,
      CacheModule,
    ]);
    cache = testingModule.get(CacheService);
    redis = testingModule.get(CacheRedisClient);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  it('returns null for a missing entry', async () => {
    expect(await cache.get(new ProfileEntry(randomUUID()))).toBeNull();
  });

  it('stores a value with the entry ttl', async () => {
    const entry = new ProfileEntry(randomUUID());

    await cache.set(entry, PROFILE);

    expect(await cache.get(entry)).toEqual(PROFILE);
    const ttl = await redis.connection.ttl(entry.key);
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(TTL_SECONDS);
  });

  it('deletes an entry', async () => {
    const entry = new ProfileEntry(randomUUID());
    await cache.set(entry, PROFILE);

    await cache.delete(entry);

    expect(await cache.get(entry)).toBeNull();
  });

  it('loads a missing value once and serves it from the cache after', async () => {
    const entry = new ProfileEntry(randomUUID());
    const load = vi.fn<() => Promise<Profile>>(() => Promise.resolve(PROFILE));

    const first = await cache.getOrLoad(entry, load);
    const second = await cache.getOrLoad(entry, load);

    expect(first).toEqual(PROFILE);
    expect(second).toEqual(PROFILE);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('treats a value of another shape as missing', async () => {
    const entry = new ProfileEntry(randomUUID());
    await redis.connection.set(entry.key, JSON.stringify({ name: 1 }));

    expect(await cache.get(entry)).toBeNull();
  });

  it('treats a value that is not JSON as missing', async () => {
    const entry = new ProfileEntry(randomUUID());
    await redis.connection.set(entry.key, '{not json');

    expect(await cache.get(entry)).toBeNull();
  });
});
