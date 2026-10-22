import { SECONDS_PER_MINUTE } from '@/platform/clock/constants/time.constants';
import { LlmPurpose } from '@/platform/llm/constants/llm-model.constants';
import { defineRateLimitPolicy } from '@/platform/rate-limit/helpers/rate-limit.helpers';

const PROMPT_TESTS_PER_MINUTE = 10;

export const PROMPT_TEST_RATE_LIMIT = defineRateLimitPolicy({
  name: 'prompts-test',
  capacity: PROMPT_TESTS_PER_MINUTE,
  refillPerSecond: PROMPT_TESTS_PER_MINUTE / SECONDS_PER_MINUTE,
});

export const PROMPT_TEST_TRACE_NAME = 'prompts-test';

export const PROMPT_TEST_PURPOSE = LlmPurpose.Conversation;

export const PROMPT_TEST_CUSTOMER_MESSAGE_MAX_LENGTH = 2000;

export const PROMPT_TEST_SAMPLE_VALUE_MAX_LENGTH = 500;

export const PROMPT_TEST_VARIABLES_MAX = 32;
