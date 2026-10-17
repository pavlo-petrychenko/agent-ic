import { PROMPT_VERSION_DATE_FORMAT } from '@/features/prompts/constants/promptVersion.constants';

export const formatPromptVersionDate = (savedAt: string, locale: string): string =>
  new Intl.DateTimeFormat(locale, PROMPT_VERSION_DATE_FORMAT).format(new Date(savedAt));
