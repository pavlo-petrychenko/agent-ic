import type { chunkTerms } from '@/modules/knowledge/db/chunk-terms.table';

export type ChunkTerm = typeof chunkTerms.$inferSelect;

export type NewChunkTerm = typeof chunkTerms.$inferInsert;

export type ChunkTermChanges = Partial<Pick<NewChunkTerm, 'frequency'>>;
