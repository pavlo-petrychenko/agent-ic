import type { KnowledgeConnectionsQuery } from '@/features/knowledge/communication/gql/query/knowledgeConnections.generated';
import type { GoogleConnection } from '@/features/knowledge/typedefs/googleConnection.typedefs';

type GoogleConnectionNode = KnowledgeConnectionsQuery['knowledgeConnections'][number];

export const toGoogleConnection = (connection: GoogleConnectionNode): GoogleConnection => ({
  id: connection.id,
  accountEmail: connection.accountEmail,
  status: connection.status,
});

export const toGoogleConnections = (data: KnowledgeConnectionsQuery): GoogleConnection[] =>
  data.knowledgeConnections.map(toGoogleConnection);
