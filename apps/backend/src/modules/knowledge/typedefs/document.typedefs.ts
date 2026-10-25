import type { documents } from '@/modules/knowledge/db/documents.table';

export type Document = typeof documents.$inferSelect;

export type NewDocument = Omit<typeof documents.$inferInsert, 'createdAt' | 'updatedAt'>;

export type DocumentChanges = Partial<Omit<NewDocument, 'id' | 'workspaceId'>>;
