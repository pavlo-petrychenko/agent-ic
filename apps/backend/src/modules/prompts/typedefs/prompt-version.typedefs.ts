import type { promptVersions } from '@/modules/prompts/db/prompt-versions.table';

export interface PromptVersion {
  readonly id: string;
  readonly workspaceId: string;
  readonly promptId: string;
  readonly number: number;
  readonly text: string;
  readonly note: string | null;
  readonly authorId: string | null;
  readonly createdAt: Date;
  readonly deletedAt: Date | null;
}

export type NewPromptVersion = typeof promptVersions.$inferInsert;
