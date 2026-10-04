import { describe, expect, it } from 'vitest';
import {
  defineRateLimitPolicy,
  rateLimitKey,
  refillPerMillisecond,
} from '@/platform/rate-limit/helpers/rate-limit.helpers';

const policy = defineRateLimitPolicy({ name: 'login', capacity: 5, refillPerSecond: 2 });

describe('rate limit helpers', () => {
  it('keeps the definition of a policy', () => {
    expect(policy).toEqual({ name: 'login', capacity: 5, refillPerSecond: 2 });
  });

  it('builds a key per policy and subject', () => {
    expect(rateLimitKey(policy, 'user-1')).toBe('rate-limit:login:user-1');
  });

  it('converts the refill rate to milliseconds', () => {
    expect(refillPerMillisecond(policy)).toBe(0.002);
  });
});
