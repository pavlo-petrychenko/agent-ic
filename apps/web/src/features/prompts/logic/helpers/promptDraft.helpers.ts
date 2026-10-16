import {
  PROMPT_DRAFT_TIME_FORMAT,
  PROMPT_FIRST_VERSION_NUMBER,
} from '@/features/prompts/constants/promptDraft.constants';

export const nextPromptVersionNumber = (latestNumber: number | null): number =>
  latestNumber === null ? PROMPT_FIRST_VERSION_NUMBER : latestNumber + PROMPT_FIRST_VERSION_NUMBER;

export const formatPromptDraftTime = (savedAt: string, locale: string): string =>
  new Intl.DateTimeFormat(locale, PROMPT_DRAFT_TIME_FORMAT).format(new Date(savedAt));
