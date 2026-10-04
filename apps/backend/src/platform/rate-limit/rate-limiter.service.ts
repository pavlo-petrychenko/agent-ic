import { Injectable } from '@nestjs/common';

import { CacheRedisClient } from '@/platform/redis/cache-redis.client';

import {
  DEFAULT_RATE_LIMIT_COST,
  RATE_LIMIT_KEY_COUNT,
  TOKEN_BUCKET_SCRIPT,
} from './rate-limit.constants';
import {
  rateLimitKey,
  refillPerMillisecond,
  toRateLimitDecision,
  toRetryAfterSeconds,
} from './rate-limit.helpers';
import type { RateLimitPolicy } from './rate-limit.policy';
import type { RateLimitDecision } from './rate-limit.typedefs';
import { RateLimitedError } from './rate-limited.error';

@Injectable()
export class RateLimiterService {
  constructor(private readonly redis: CacheRedisClient) {}

  async consume(
    policy: RateLimitPolicy,
    subject: string,
    cost: number = DEFAULT_RATE_LIMIT_COST,
  ): Promise<RateLimitDecision> {
    const reply: unknown = await this.redis.connection.eval(
      TOKEN_BUCKET_SCRIPT,
      RATE_LIMIT_KEY_COUNT,
      rateLimitKey(policy, subject),
      policy.capacity,
      refillPerMillisecond(policy),
      cost,
    );
    return toRateLimitDecision(reply);
  }

  async enforce(
    policy: RateLimitPolicy,
    subject: string,
    cost: number = DEFAULT_RATE_LIMIT_COST,
  ): Promise<void> {
    const decision = await this.consume(policy, subject, cost);
    if (!decision.allowed) {
      throw new RateLimitedError(toRetryAfterSeconds(decision.retryAfterMs));
    }
  }
}
