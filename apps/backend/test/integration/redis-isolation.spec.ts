import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest';
import { z } from 'zod';
import { defineCacheEntry } from '@/platform/cache/helpers/cache.helpers';
import { CacheService } from '@/platform/cache/services/cache.service';
import { ConfigService } from '@/platform/config/services/config.service';
import { ActorKind, SystemReason } from '@/platform/context/constants/actor.constants';
import { ChannelPublisherService } from '@/platform/live-updates/services/channel-publisher.service';
import { ChannelSubscriberService } from '@/platform/live-updates/services/channel-subscriber.service';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { ENVELOPE_VERSION } from '@/platform/queues/constants/job.constants';
import { QueueName } from '@/platform/queues/constants/queue.constants';
import { QueuesService } from '@/platform/queues/services/queues.service';
import { defineRateLimitPolicy } from '@/platform/rate-limit/helpers/rate-limit.helpers';
import { RateLimitService } from '@/platform/rate-limit/services/rate-limit.service';
import { RedisConnectionName } from '@/platform/redis/constants/redis.constants';
import {
  closeRedisConnection,
  createRedisConnection,
} from '@/platform/redis/helpers/redis.helpers';
import { CacheRedisService } from '@/platform/redis/services/cache-redis.service';
import {
  TEST_INFRASTRUCTURE_KEY,
  TestRedisPrefix,
} from '@test/support/constants/test-infrastructure.constants';
import { createIntegrationConfig } from '@test/support/fixtures/integration-env.fixture';

const QUEUE = QueueName.Notify;
const TTL_SECONDS = 60;
const REFILL_PERIOD_SECONDS = 3_600;

const markerEntryOf = defineCacheEntry({
  name: 'test-isolation',
  schema: z.object({ owner: z.string() }),
  ttlSeconds: TTL_SECONDS,
});

const oneCallPolicy = defineRateLimitPolicy({
  name: 'test-isolation',
  capacity: 1,
  refillPerSecond: 1 / REFILL_PERIOD_SECONDS,
});

const startSuite = (prefix: TestRedisPrefix) => {
  const config = new ConfigService(
    createIntegrationConfig({ role: Role.Worker, queues: [QUEUE] }, prefix),
  );
  const redis = new CacheRedisService(config);
  return {
    redis,
    cache: new CacheService(redis),
    limiter: new RateLimitService(redis),
    publisher: new ChannelPublisherService(config),
    subscriber: new ChannelSubscriberService(config),
    queues: new QueuesService(config),
  };
};

type Suite = ReturnType<typeof startSuite>;

const stopSuite = async (suite: Suite): Promise<void> => {
  await suite.queues.get(QUEUE).obliterate({ force: true });
  await Promise.all([
    suite.redis.onApplicationShutdown(),
    suite.publisher.onApplicationShutdown(),
    suite.subscriber.onApplicationShutdown(),
    suite.queues.onApplicationShutdown(),
  ]);
};

describe('redis isolation by key prefix', () => {
  let first: Suite;
  let second: Suite;

  beforeAll(() => {
    first = startSuite(TestRedisPrefix.IsolationFirst);
    second = startSuite(TestRedisPrefix.IsolationSecond);
  });

  afterAll(async () => {
    await Promise.all([stopSuite(first), stopSuite(second)]);
  });

  it('gives every suite its own prefix', () => {
    const prefixes = Object.values(TestRedisPrefix);

    expect(new Set(prefixes).size).toBe(prefixes.length);
  });

  it('writes keys under the suite prefix', async () => {
    const markerEntry = markerEntryOf(randomUUID());
    const raw = createRedisConnection(
      inject(TEST_INFRASTRUCTURE_KEY).redisUrl,
      RedisConnectionName.Cache,
    );
    await first.cache.set(markerEntry, { owner: 'first' });

    const prefixed = await raw.exists(`${TestRedisPrefix.IsolationFirst}${markerEntry.key}`);
    const bare = await raw.exists(markerEntry.key);
    await closeRedisConnection(raw);

    expect(prefixed).toBe(1);
    expect(bare).toBe(0);
  });

  it('does not share cache keys between suites', async () => {
    const markerEntry = markerEntryOf(randomUUID());
    await first.cache.set(markerEntry, { owner: 'first' });

    expect(await second.cache.get(markerEntry)).toBeNull();
    expect(await first.cache.get(markerEntry)).toEqual({ owner: 'first' });
  });

  it('does not share rate-limit buckets between suites', async () => {
    const subject = randomUUID();

    await first.limiter.consume(oneCallPolicy, subject);

    expect((await first.limiter.consume(oneCallPolicy, subject)).allowed).toBe(false);
    expect((await second.limiter.consume(oneCallPolicy, subject)).allowed).toBe(true);
  });

  it('does not deliver channel messages to another suite', async () => {
    const channel = randomUUID();
    const firstMessages = await first.subscriber.listen(channel);
    const secondMessages = await second.subscriber.listen(channel);

    await first.publisher.publish(channel, 'first');
    await second.publisher.publish(channel, 'second');

    expect((await firstMessages.next()).value).toEqual(['first']);
    expect((await secondMessages.next()).value).toEqual(['second']);
    await Promise.all([first.subscriber.release(channel), second.subscriber.release(channel)]);
  });

  it('does not show one suite the jobs of another', async () => {
    await first.queues.get(QUEUE).add(randomUUID(), {
      version: ENVELOPE_VERSION,
      data: {},
      workspaceId: null,
      traceId: randomUUID(),
      initiatedBy: { kind: ActorKind.System, reason: SystemReason.Job },
    });

    expect(await first.queues.get(QUEUE).count()).toBe(1);
    expect(await second.queues.get(QUEUE).count()).toBe(0);
  });
});
