import type { connections } from '@/modules/knowledge/db/connections.table';

export type Connection = typeof connections.$inferSelect;

export type NewConnection = Omit<typeof connections.$inferInsert, 'createdAt' | 'updatedAt'>;

export type ConnectionChanges = Partial<Omit<NewConnection, 'id' | 'workspaceId'>>;
