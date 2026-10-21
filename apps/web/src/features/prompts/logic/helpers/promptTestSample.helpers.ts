import {
  PROMPT_TEST_CHANNEL_DEFAULT,
  PROMPT_TEST_CHANNEL_PATH,
  PROMPT_TEST_DATE_OPTIONS,
  PROMPT_TEST_SAMPLE_KINDS,
  PROMPT_TEST_TODAY_PATH,
} from '@/features/prompts/constants/promptTestSample.constants';
import { PromptTestSampleKind } from '@/features/prompts/typedefs/promptTest.typedefs';
import type {
  PromptTestNameValue,
  PromptTestSampleField,
} from '@/features/prompts/typedefs/promptTest.typedefs';

export const promptTestSampleKind = (path: string): PromptTestSampleKind =>
  PROMPT_TEST_SAMPLE_KINDS[path] ?? PromptTestSampleKind.Text;

export const defaultSampleValue = (path: string, locale: string, today: Date): string => {
  if (path === PROMPT_TEST_TODAY_PATH) {
    return new Intl.DateTimeFormat(locale, PROMPT_TEST_DATE_OPTIONS).format(today);
  }
  if (path === PROMPT_TEST_CHANNEL_PATH) {
    return PROMPT_TEST_CHANNEL_DEFAULT;
  }
  return '';
};

export const buildPromptTestSampleFields = (
  paths: readonly string[],
  values: Readonly<Record<string, string>>,
  locale: string,
  today: Date,
): readonly PromptTestSampleField[] =>
  paths.map((path) => ({
    path,
    kind: promptTestSampleKind(path),
    value: values[path] ?? defaultSampleValue(path, locale, today),
  }));

export const toPromptTestVariables = (
  paths: readonly string[],
  values: Readonly<Record<string, string>>,
  locale: string,
  today: Date,
): readonly PromptTestNameValue[] =>
  paths.map((path) => ({
    name: path,
    value: values[path] ?? defaultSampleValue(path, locale, today),
  }));
