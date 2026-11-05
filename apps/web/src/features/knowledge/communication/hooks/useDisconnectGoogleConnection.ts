import { useMutation } from '@apollo/client/react';
import { useCallback, useState } from 'react';
import { DisconnectGoogleConnectionDocument } from '@/features/knowledge/communication/gql/mutation/disconnectGoogleConnection.generated';
import { KnowledgeConnectionsDocument } from '@/features/knowledge/communication/gql/query/knowledgeConnections.generated';
import type { UseDisconnectGoogleConnectionResult } from '@/features/knowledge/typedefs/googleConnection.typedefs';

export function useDisconnectGoogleConnection(): UseDisconnectGoogleConnectionResult {
  const [disconnect] = useMutation(DisconnectGoogleConnectionDocument, {
    refetchQueries: [KnowledgeConnectionsDocument],
    awaitRefetchQueries: true,
  });
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

  const disconnectGoogleConnection = useCallback(
    async (id: string) => {
      setDisconnectingId(id);
      try {
        await disconnect({ variables: { input: { id } } });
      } finally {
        setDisconnectingId(null);
      }
    },
    [disconnect],
  );

  return { disconnectGoogleConnection, disconnectingId };
}
