import { PROMPT_FOLDER_NAME_MAX_LENGTH } from '@agent-ic/contracts';
import { z } from 'zod';
import { PromptFolderField } from '@/modules/prompts/constants/prompt-folder-input.constants';

const promptFolderNameSchema = z.string().trim().min(1).max(PROMPT_FOLDER_NAME_MAX_LENGTH);
const promptFolderIdSchema = z.string().min(1);

export const createPromptFolderInputSchema = z.object({
  [PromptFolderField.Name]: promptFolderNameSchema,
});

export const deletePromptFolderInputSchema = z.object({
  [PromptFolderField.Id]: promptFolderIdSchema,
});

export const renamePromptFolderInputSchema = z.object({
  [PromptFolderField.Id]: promptFolderIdSchema,
  [PromptFolderField.Name]: promptFolderNameSchema,
});
