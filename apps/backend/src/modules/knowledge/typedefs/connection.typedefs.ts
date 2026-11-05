import type {
  KnowledgeConnectionProvider,
  KnowledgeConnectionStatus,
} from '@/modules/knowledge/constants/knowledge.constants';
import type { connections } from '@/modules/knowledge/db/connections.table';

export type Connection = typeof connections.$inferSelect;

export type NewConnection = Omit<typeof connections.$inferInsert, 'createdAt' | 'updatedAt'>;

export type ConnectionChanges = Partial<Omit<NewConnection, 'id' | 'workspaceId'>>;

export interface KnowledgeConnectionView {
  readonly id: string;
  readonly provider: KnowledgeConnectionProvider;
  readonly accountEmail: string;
  readonly status: KnowledgeConnectionStatus;
  readonly scopes: readonly string[];
  readonly lastErrorCode: string | null;
  readonly lastErrorMessage: string | null;
  readonly lastUsedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CompleteGoogleConnectionInput {
  readonly state: string;
  readonly code: string;
}

export interface DisconnectGoogleConnectionInput {
  readonly id: string;
}
