import type { promptFolders } from '@/modules/prompts/db/prompt-folders.table';

export interface PromptFolder {
  readonly id: string;
  readonly workspaceId: string;
  readonly name: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;
}

export type NewPromptFolder = typeof promptFolders.$inferInsert;

export interface PromptFolderView {
  readonly id: string;
  readonly name: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CreatePromptFolderInput {
  readonly name: string;
}
