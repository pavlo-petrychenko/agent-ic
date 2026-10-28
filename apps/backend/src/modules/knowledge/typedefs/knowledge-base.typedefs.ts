import type { knowledgeBases } from '@/modules/knowledge/db/knowledge-bases.table';

export type KnowledgeBase = typeof knowledgeBases.$inferSelect;

export type NewKnowledgeBase = Omit<typeof knowledgeBases.$inferInsert, 'createdAt' | 'updatedAt'>;

export type KnowledgeBaseChanges = Partial<Omit<NewKnowledgeBase, 'id' | 'workspaceId'>>;

export interface KnowledgeBaseView {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly toolName: string;
  readonly toolDescription: string | null;
  readonly documentCount: number;
  readonly chunkCount: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CreateKnowledgeBaseInput {
  readonly name: string;
  readonly description?: string | null;
}

export interface DeleteKnowledgeBaseInput {
  readonly id: string;
}

export interface RenameKnowledgeBaseInput {
  readonly id: string;
  readonly name: string;
}
