import {
  KnowledgeConnectionProvider,
  KnowledgeConnectionStatus,
} from '@/modules/knowledge/constants/knowledge.constants';
import type { KnowledgeConnectionView } from '@/modules/knowledge/typedefs/connection.typedefs';
import {
  KnowledgeConnectionProvider as GraphqlKnowledgeConnectionProvider,
  KnowledgeConnectionStatus as GraphqlKnowledgeConnectionStatus,
} from '@/platform/graphql-server/generated/schema.generated';
import type { GoogleConnection } from '@/platform/graphql-server/generated/schema.generated';

const PROVIDER: Readonly<Record<KnowledgeConnectionProvider, GraphqlKnowledgeConnectionProvider>> =
  {
    [KnowledgeConnectionProvider.GoogleDocs]: GraphqlKnowledgeConnectionProvider.GoogleDocs,
  };

const STATUS: Readonly<Record<KnowledgeConnectionStatus, GraphqlKnowledgeConnectionStatus>> = {
  [KnowledgeConnectionStatus.Active]: GraphqlKnowledgeConnectionStatus.Active,
  [KnowledgeConnectionStatus.Revoked]: GraphqlKnowledgeConnectionStatus.Revoked,
  [KnowledgeConnectionStatus.Error]: GraphqlKnowledgeConnectionStatus.Error,
};

export const toGraphqlGoogleConnection = (
  connection: KnowledgeConnectionView,
): GoogleConnection => ({
  id: connection.id,
  provider: PROVIDER[connection.provider],
  accountEmail: connection.accountEmail,
  status: STATUS[connection.status],
  scopes: connection.scopes,
  lastErrorCode: connection.lastErrorCode,
  lastErrorMessage: connection.lastErrorMessage,
  lastUsedAt: connection.lastUsedAt?.toISOString() ?? null,
  createdAt: connection.createdAt.toISOString(),
  updatedAt: connection.updatedAt.toISOString(),
});

export const toGraphqlGoogleConnections = (
  connections: readonly KnowledgeConnectionView[],
): GoogleConnection[] => connections.map(toGraphqlGoogleConnection);
