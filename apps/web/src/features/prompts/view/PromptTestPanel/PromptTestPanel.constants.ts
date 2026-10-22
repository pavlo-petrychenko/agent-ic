import { PROMPT_TEST_CHANNEL_VALUES } from '@/features/prompts/constants/promptTestSample.constants';

export const PROMPT_TEST_CHANNEL_OPTIONS = PROMPT_TEST_CHANNEL_VALUES.map((value) => ({
  value,
  label: value,
}));
