import { PROMPT_FOLDER_NAME_MAX_LENGTH, PROMPT_NAME_MAX_LENGTH } from '@agent-ic/contracts';
import { z } from 'zod';
import { PromptFormField } from '@/features/prompts/constants/promptForm.constants';

interface PromptSchemaMessages {
  readonly name: string;
  readonly folder: string;
}

export const createPromptSchema = (messages: PromptSchemaMessages) =>
  z.object({
    [PromptFormField.Name]: z
      .string()
      .trim()
      .min(1, messages.name)
      .max(PROMPT_NAME_MAX_LENGTH, messages.name),
    [PromptFormField.Folder]: z
      .string()
      .trim()
      .min(1, messages.folder)
      .max(PROMPT_FOLDER_NAME_MAX_LENGTH, messages.folder),
  });
