import { skipToken, useQuery } from '@apollo/client/react';
import { useCallback, useMemo } from 'react';
import { VersionHistoryDocument } from '@/features/testing/communication/gql/query/versionHistory.generated';
import { toVersionHistory } from '@/features/testing/communication/helpers/versionHistory.helpers';
import type { VersionHistoryResult } from '@/features/testing/typedefs/versions.typedefs';

export function useVersionHistory(agentId: string | null): VersionHistoryResult {
  const { data, loading, error, refetch } = useQuery(
    VersionHistoryDocument,
    agentId === null
      ? skipToken
      : { variables: { agentId }, fetchPolicy: 'network-only', notifyOnNetworkStatusChange: true },
  );
  const history = useMemo(() => (data === undefined ? null : toVersionHistory(data)), [data]);
  const retry = useCallback(() => void refetch().catch(() => undefined), [refetch]);
  return {
    history,
    loading: agentId !== null && history === null && (loading || error === undefined),
    failed: !loading && error !== undefined && history === null,
    retry,
  };
}
