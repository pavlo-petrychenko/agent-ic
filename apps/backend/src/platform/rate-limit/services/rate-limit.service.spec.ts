import { randomUUID } from 'node:crypto';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { MILLISECONDS_PER_SECOND } from '@/platform/clock/constants/time.constants';
import { TOKEN_BUCKET_UPDATED_FIELD } from '@/platform/rate-limit/constants/token-bucket.constants';
import { RateLimitedError } from '@/platform/rate-limit/errors/rate-limited.error';
import {
  defineRateLimitPolicy,
  rateLimitKey,
} from '@/platform/rate-limit/helpers/rate-limit.helpers';
import { RateLimitModule } from '@/platform/rate-limit/rate-limit.module';
import { RateLimitService } from '@/platform/rate-limit/services/rate-limit.service';
import type { RateLimitPolicy } from '@/platform/rate-limit/typedefs/rate-limit.typedefs';
import { RedisModule } from '@/platform/redis/redis.module';
import { CacheRedisService } from '@/platform/redis/services/cache-redis.service';
import { TestRedisDatabase } from '@test/support/constants/test-infrastructure.constants';
import { createPlatformTestingModule } from '@test/support/helpers/database-testing.helpers';

const CAPACITY = 3;
const REFILL_PERIOD_SECONDS = 3_600;
const REFILL_PERIOD_MS = REFILL_PERIOD_SECONDS * MILLISECONDS_PER_SECOND;
const HALF_REFILL_PERIOD_MS = REFILL_PERIOD_MS / 2;

const slow = defineRateLimitPolicy({
  name: 'test-slow',
  capacity: CAPACITY,
  refillPerSecond: 1 / REFILL_PERIOD_SECONDS,
});

describe('RateLimitService', () => {
  let testingModule: TestingModule;
  let limiter: RateLimitService;
  let redis: CacheRedisService;

  beforeAll(async () => {
    testingModule = await createPlatformTestingModule(TestRedisDatabase.RateLimit, [
      RedisModule,
      RateLimitModule,
    ]);
    limiter = testingModule.get(RateLimitService);
    redis = testingModule.get(CacheRedisService);
  });

  const rewindBucket = async (
    policy: RateLimitPolicy,
    subject: string,
    milliseconds: number,
  ): Promise<void> => {
    const key = rateLimitKey(policy, subject);
    const updated = Number(await redis.connection.hget(key, TOKEN_BUCKET_UPDATED_FIELD));
    await redis.connection.hset(key, TOKEN_BUCKET_UPDATED_FIELD, updated - milliseconds);
  };

  afterAll(async () => {
    await testingModule.close();
  });

  it('allows calls up to the capacity and blocks the next one', async () => {
    const subject = randomUUID();

    const decisions = [];
    for (let call = 0; call <= CAPACITY; call += 1) {
      decisions.push(await limiter.consume(slow, subject));
    }

    expect(decisions.map((decision) => decision.allowed)).toEqual([true, true, true, false]);
    expect(decisions.map((decision) => decision.remaining)).toEqual([2, 1, 0, 0]);
    expect(decisions.at(-1)?.retryAfterMs).toBeGreaterThan(0);
  });

  it('throws a rate-limit error when enforcing past the capacity', async () => {
    const subject = randomUUID();
    for (let call = 0; call < CAPACITY; call += 1) {
      await limiter.enforce(slow, subject);
    }

    const blocked = limiter.enforce(slow, subject);

    await expect(blocked).rejects.toBeInstanceOf(RateLimitedError);
    await expect(blocked).rejects.toMatchObject({ retryAfterSeconds: expect.any(Number) });
  });

  it('keeps a separate bucket per subject', async () => {
    const first = randomUUID();
    const second = randomUUID();
    for (let call = 0; call < CAPACITY; call += 1) {
      await limiter.consume(slow, first);
    }

    const decision = await limiter.consume(slow, second);

    expect(decision.allowed).toBe(true);
  });

  it('refills tokens over time', async () => {
    const subject = randomUUID();
    for (let call = 0; call < CAPACITY; call += 1) {
      await limiter.consume(slow, subject);
    }
    expect((await limiter.consume(slow, subject)).allowed).toBe(false);

    await rewindBucket(slow, subject, HALF_REFILL_PERIOD_MS);
    expect((await limiter.consume(slow, subject)).allowed).toBe(false);

    await rewindBucket(slow, subject, HALF_REFILL_PERIOD_MS);
    expect((await limiter.consume(slow, subject)).allowed).toBe(true);
    expect((await limiter.consume(slow, subject)).allowed).toBe(false);
  });
});
