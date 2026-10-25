import type { knowledgeBases } from '@/modules/knowledge/db/knowledge-bases.table';

export type KnowledgeBase = typeof knowledgeBases.$inferSelect;

export type NewKnowledgeBase = Omit<typeof knowledgeBases.$inferInsert, 'createdAt' | 'updatedAt'>;

export type KnowledgeBaseChanges = Partial<Omit<NewKnowledgeBase, 'id' | 'workspaceId'>>;
