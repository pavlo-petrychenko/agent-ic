import { PROMPT_FIRST_VERSION_NUMBER } from '@/features/prompts/constants/promptDraft.constants';

export const nextPromptVersionNumber = (latestNumber: number | null): number =>
  latestNumber === null ? PROMPT_FIRST_VERSION_NUMBER : latestNumber + PROMPT_FIRST_VERSION_NUMBER;
