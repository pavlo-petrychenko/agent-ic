import { PROMPT_FOLDER_NAME_MAX_LENGTH } from '@agent-ic/contracts';
import { z } from 'zod';
import { PromptFolderField } from '@/modules/prompts/constants/prompt-folder-input.constants';

const promptFolderNameSchema = z.string().trim().min(1).max(PROMPT_FOLDER_NAME_MAX_LENGTH);

export const createPromptFolderInputSchema = z.object({
  [PromptFolderField.Name]: promptFolderNameSchema,
});
