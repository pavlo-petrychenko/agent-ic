import type { syncRuns } from '@/modules/knowledge/db/sync-runs.table';

export type SyncRun = typeof syncRuns.$inferSelect;

export type NewSyncRun = Omit<typeof syncRuns.$inferInsert, 'createdAt'>;

export type SyncRunChanges = Partial<Omit<NewSyncRun, 'id' | 'workspaceId' | 'sourceId'>>;
