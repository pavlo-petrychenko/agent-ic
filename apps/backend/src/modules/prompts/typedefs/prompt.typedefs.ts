import type { prompts } from '@/modules/prompts/db/prompts.table';

export interface Prompt {
  readonly id: string;
  readonly workspaceId: string;
  readonly name: string;
  readonly folderId: string;
  readonly createdByUserId: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;
}

export type NewPrompt = typeof prompts.$inferInsert;

export interface PromptView {
  readonly id: string;
  readonly name: string;
  readonly folderId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CreatePromptInput {
  readonly name: string;
  readonly folderId: string;
}

export interface RenamePromptInput {
  readonly id: string;
  readonly name: string;
}
