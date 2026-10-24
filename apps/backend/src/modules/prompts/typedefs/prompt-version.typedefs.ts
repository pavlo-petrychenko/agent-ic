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

export type NewPromptVersion = Omit<typeof promptVersions.$inferInsert, 'createdAt'>;

export interface SavePromptVersionInput {
  readonly id: string;
  readonly text: string;
  readonly note?: string | null;
}

export interface ListPromptVersionsInput {
  readonly promptId: string;
}

export interface PromptVersionIdInput {
  readonly id: string;
}

export interface PromptVersionAuthor {
  readonly name: string;
}

export interface PromptVersionLabels {
  readonly id: string;
  readonly author: PromptVersionAuthor | null;
}

export interface PromptVersionView {
  readonly id: string;
  readonly number: number;
  readonly text: string;
  readonly variables: readonly string[];
  readonly note: string | null;
  readonly author: PromptVersionAuthor | null;
  readonly createdAt: Date;
}
