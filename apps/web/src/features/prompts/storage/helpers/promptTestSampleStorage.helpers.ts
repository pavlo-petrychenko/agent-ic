import {
  PROMPT_TEST_SAMPLE_KEY_SEPARATOR,
  PROMPT_TEST_SAMPLE_STORAGE_KEY_PREFIX,
} from '@/features/prompts/constants/promptTestSample.constants';

const SAMPLE_KEY_PREFIX = `${PROMPT_TEST_SAMPLE_STORAGE_KEY_PREFIX}${PROMPT_TEST_SAMPLE_KEY_SEPARATOR}`;

const sampleKey = (promptId: string): string => `${SAMPLE_KEY_PREFIX}${promptId}`;

const toSampleValues = (stored: unknown): Readonly<Record<string, string>> => {
  if (typeof stored !== 'object' || stored === null) {
    return {};
  }
  const values: Record<string, string> = {};
  for (const [path, value] of Object.entries(stored as Record<string, unknown>)) {
    if (typeof value === 'string') {
      values[path] = value;
    }
  }
  return values;
};

export const readPromptTestSamples = (promptId: string): Readonly<Record<string, string>> => {
  try {
    const stored = window.localStorage.getItem(sampleKey(promptId));
    return stored === null ? {} : toSampleValues(JSON.parse(stored));
  } catch {
    return {};
  }
};

export const storePromptTestSamples = (
  promptId: string,
  values: Readonly<Record<string, string>>,
): void => {
  try {
    window.localStorage.setItem(sampleKey(promptId), JSON.stringify(values));
  } catch {
    return;
  }
};

export const removePromptTestSamples = (promptId: string): void => {
  try {
    window.localStorage.removeItem(sampleKey(promptId));
  } catch {
    return;
  }
};
