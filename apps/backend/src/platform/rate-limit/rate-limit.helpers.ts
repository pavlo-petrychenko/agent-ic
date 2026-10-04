import { z } from 'zod';

import {
  MILLISECONDS_PER_SECOND,
  RATE_LIMIT_ALLOWED,
  RATE_LIMIT_KEY_SEPARATOR,
  RATE_LIMIT_ROOT,
} from './rate-limit.constants';
import type { RateLimitPolicy } from './rate-limit.policy';
import type { RateLimitDecision } from './rate-limit.typedefs';

const tokenBucketReplySchema = z.tuple([z.number(), z.number(), z.number()]);

export const rateLimitKey = (policy: RateLimitPolicy, subject: string): string =>
  [RATE_LIMIT_ROOT, policy.name, subject].join(RATE_LIMIT_KEY_SEPARATOR);

export const refillPerMillisecond = (policy: RateLimitPolicy): number =>
  policy.refillPerSecond / MILLISECONDS_PER_SECOND;

export const toRateLimitDecision = (reply: unknown): RateLimitDecision => {
  const [allowed, remaining, retryAfterMs] = tokenBucketReplySchema.parse(reply);
  return { allowed: allowed === RATE_LIMIT_ALLOWED, remaining, retryAfterMs };
};

export const toRetryAfterSeconds = (retryAfterMs: number): number =>
  Math.ceil(retryAfterMs / MILLISECONDS_PER_SECOND);
