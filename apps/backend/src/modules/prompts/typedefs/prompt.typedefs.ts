import type { prompts } from '@/modules/prompts/db/prompts.table';
import type { PromptVersionView } from '@/modules/prompts/typedefs/prompt-version.typedefs';

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
  readonly latestVersionNumber: number | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface PromptDetailView {
  readonly prompt: PromptView;
  readonly latestVersion: PromptVersionView | null;
}

export interface CreatePromptInput {
  readonly name: string;
  readonly folderId: string;
}

export interface RenamePromptInput {
  readonly id: string;
  readonly name: string;
}

export interface MovePromptToFolderInput {
  readonly id: string;
  readonly folderId: string;
}

export interface DuplicatePromptInput {
  readonly id: string;
  readonly folderId: string;
}

export interface PromptIdInput {
  readonly id: string;
}

export interface PromptListFilters {
  readonly folderId: string | null;
  readonly search: string | null;
}

export interface ListPromptsInput {
  readonly folderId?: string | null;
  readonly search?: string | null;
}
