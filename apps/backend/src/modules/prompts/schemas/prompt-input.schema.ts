import { PROMPT_NAME_MAX_LENGTH, PROMPT_VERSION_NOTE_MAX_LENGTH } from '@agent-ic/contracts';
import { MAX_TEMPLATE_LENGTH } from '@agent-ic/flow';
import { z } from 'zod';
import { PromptField } from '@/modules/prompts/constants/prompt-input.constants';

const promptNameSchema = z.string().trim().min(1).max(PROMPT_NAME_MAX_LENGTH);
const promptTextSchema = z.string().trim().min(1).max(MAX_TEMPLATE_LENGTH);
const promptVersionNoteSchema = z.string().trim().max(PROMPT_VERSION_NOTE_MAX_LENGTH).nullish();
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

export const savePromptVersionInputSchema = z.object({
  [PromptField.Id]: recordIdSchema,
  [PromptField.Text]: promptTextSchema,
  [PromptField.Note]: promptVersionNoteSchema,
});

export const listPromptVersionsInputSchema = z.object({
  [PromptField.PromptId]: recordIdSchema,
});

export const promptVersionIdInputSchema = z.object({
  [PromptField.Id]: recordIdSchema,
});

export const duplicatePromptInputSchema = z.object({
  [PromptField.Id]: recordIdSchema,
  [PromptField.FolderId]: recordIdSchema,
});
