import { SECONDS_PER_HOUR } from '@/platform/clock/constants/time.constants';
import { defineRateLimitPolicy } from '@/platform/rate-limit/helpers/rate-limit.helpers';

const LLM_KEY_CHECKS_PER_HOUR = 20;

export const LLM_KEY_CHECK_RATE_LIMIT = defineRateLimitPolicy({
  name: 'llm-keys-check',
  capacity: LLM_KEY_CHECKS_PER_HOUR,
  refillPerSecond: LLM_KEY_CHECKS_PER_HOUR / SECONDS_PER_HOUR,
});
