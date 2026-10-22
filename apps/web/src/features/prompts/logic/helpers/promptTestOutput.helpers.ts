import { PROMPT_TEST_DURATION_FRACTION_DIGITS } from '@/features/prompts/constants/promptTestSample.constants';

const MS_PER_SECOND = 1000;
const JSON_INDENT = 2;

export const formatPromptTestDuration = (durationMs: number, locale: string): string =>
  `${new Intl.NumberFormat(locale, {
    minimumFractionDigits: PROMPT_TEST_DURATION_FRACTION_DIGITS,
    maximumFractionDigits: PROMPT_TEST_DURATION_FRACTION_DIGITS,
  }).format(durationMs / MS_PER_SECOND)} s`;

export const formatPromptTestOutput = (output: unknown): string =>
  JSON.stringify(output, null, JSON_INDENT);
