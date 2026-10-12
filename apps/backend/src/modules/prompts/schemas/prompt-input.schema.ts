import { PROMPT_NAME_MAX_LENGTH } from '@agent-ic/contracts';
import { z } from 'zod';
import { PromptField } from '@/modules/prompts/constants/prompt-input.constants';

const promptNameSchema = z.string().trim().min(1).max(PROMPT_NAME_MAX_LENGTH);
const recordIdSchema = z.string().min(1);

export const createPromptInputSchema = z.object({
  [PromptField.Name]: promptNameSchema,
  [PromptField.FolderId]: recordIdSchema,
});

export const renamePromptInputSchema = z.object({
  [PromptField.Id]: recordIdSchema,
  [PromptField.Name]: promptNameSchema,
});

export const movePromptToFolderInputSchema = z.object({
  [PromptField.Id]: recordIdSchema,
  [PromptField.FolderId]: recordIdSchema,
});

export const promptIdInputSchema = z.object({
  [PromptField.Id]: recordIdSchema,
});

export const duplicatePromptInputSchema = z.object({
  [PromptField.Id]: recordIdSchema,
  [PromptField.FolderId]: recordIdSchema,
});
