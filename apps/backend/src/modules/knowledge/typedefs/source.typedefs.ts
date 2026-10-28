import type { sources } from '@/modules/knowledge/db/sources.table';

export type Source = typeof sources.$inferSelect;

export type NewSource = Omit<typeof sources.$inferInsert, 'createdAt' | 'updatedAt'>;

export type SourceChanges = Partial<Omit<NewSource, 'id' | 'workspaceId'>>;
