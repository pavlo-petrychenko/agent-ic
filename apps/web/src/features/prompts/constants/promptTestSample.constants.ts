import { PromptTestSampleKind } from '@/features/prompts/typedefs/promptTest.typedefs';

export const PROMPT_TEST_SAMPLE_STORAGE_KEY_PREFIX = 'agent-ic.prompt-test';
export const PROMPT_TEST_SAMPLE_KEY_SEPARATOR = ':';

export const PROMPT_TEST_CHANNEL_PATH = 'channel';
export const PROMPT_TEST_TODAY_PATH = 'today';

export const PROMPT_TEST_SAMPLE_KINDS: Readonly<Record<string, PromptTestSampleKind>> = {
  [PROMPT_TEST_CHANNEL_PATH]: PromptTestSampleKind.Channel,
  [PROMPT_TEST_TODAY_PATH]: PromptTestSampleKind.Today,
};

export const PROMPT_TEST_CHANNEL_VALUES: readonly string[] = ['telegram', 'api'];
export const PROMPT_TEST_CHANNEL_DEFAULT = 'telegram';

export const PROMPT_TEST_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
};

export const PROMPT_TEST_DURATION_FRACTION_DIGITS = 1;

export const PROMPT_TEST_CONVERSATION_PURPOSE = 'conversation';
