import { Injectable } from '@nestjs/common';
import {
  DEFAULT_RATE_LIMIT_COST,
  RATE_LIMIT_KEY_COUNT,
} from '@/platform/rate-limit/constants/rate-limit.constants';
import { TOKEN_BUCKET_SCRIPT } from '@/platform/rate-limit/constants/token-bucket.constants';
import { RateLimitedError } from '@/platform/rate-limit/errors/rate-limited.error';
import {
  rateLimitKey,
  refillPerMillisecond,
  toRateLimitDecision,
  toRetryAfterSeconds,
} from '@/platform/rate-limit/helpers/rate-limit.helpers';
import type {
  RateLimitDecision,
  RateLimitPolicy,
} from '@/platform/rate-limit/typedefs/rate-limit.typedefs';
import { CacheRedisService } from '@/platform/redis/services/cache-redis.service';

@Injectable()
export class RateLimitService {
  constructor(private readonly redis: CacheRedisService) {}

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
