import { randomUUID } from 'node:crypto';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { RateLimitedError } from '@/platform/rate-limit/errors/rate-limited.error';
import { defineRateLimitPolicy } from '@/platform/rate-limit/helpers/rate-limit.helpers';
import { RateLimitModule } from '@/platform/rate-limit/rate-limit.module';
import { RateLimitService } from '@/platform/rate-limit/services/rate-limit.service';
import { RedisModule } from '@/platform/redis/redis.module';
import { TestRedisDatabase } from '@test/support/constants/test-infrastructure.constants';
import { createPlatformTestingModule } from '@test/support/helpers/database-testing.helpers';

const CAPACITY = 3;
const WAIT = { timeout: 2_000, interval: 10 };

const slow = defineRateLimitPolicy({
  name: 'test-slow',
  capacity: CAPACITY,
  refillPerSecond: 1 / 3_600,
});

const fast = defineRateLimitPolicy({ name: 'test-fast', capacity: 1, refillPerSecond: 100 });

describe('RateLimitService', () => {
  let testingModule: TestingModule;
  let limiter: RateLimitService;

  beforeAll(async () => {
    testingModule = await createPlatformTestingModule(TestRedisDatabase.RateLimit, [
      RedisModule,
      RateLimitModule,
    ]);
    limiter = testingModule.get(RateLimitService);
  });

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
    await limiter.consume(fast, subject);
    expect((await limiter.consume(fast, subject)).allowed).toBe(false);

    await vi.waitFor(async () => {
      expect((await limiter.consume(fast, subject)).allowed).toBe(true);
    }, WAIT);
  });
});
