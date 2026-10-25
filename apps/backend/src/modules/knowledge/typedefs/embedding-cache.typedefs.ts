import type { embeddingCache } from '@/modules/knowledge/db/embedding-cache.table';

export type EmbeddingCacheEntry = typeof embeddingCache.$inferSelect;

export type NewEmbeddingCacheEntry = Omit<
  typeof embeddingCache.$inferInsert,
  'createdAt' | 'lastUsedAt'
>;

export type EmbeddingCacheChanges = Partial<Pick<NewEmbeddingCacheEntry, 'embedding'>>;
