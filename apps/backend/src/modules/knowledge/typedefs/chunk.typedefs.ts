import type { chunks } from '@/modules/knowledge/db/chunks.table';

export type Chunk = typeof chunks.$inferSelect;

export type NewChunk = Omit<typeof chunks.$inferInsert, 'createdAt'>;

export type ChunkChanges = Partial<Omit<NewChunk, 'id' | 'workspaceId'>>;
