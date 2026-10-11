import { skipToken, useQuery } from '@apollo/client/react';
import { useMemo } from 'react';
import { toFlowDiff } from '@/features/flow-builder';
import { VersionDiffDocument } from '@/features/testing/communication/gql/query/versionDiff.generated';
import type { VersionDiffResult } from '@/features/testing/typedefs/versions.typedefs';

export function useVersionDiff(
  agentId: string | null,
  fromId: string | null,
  toId: string | null,
): VersionDiffResult {
  const skipped = agentId === null || fromId === null || toId === null;
  const { data, loading, error, refetch } = useQuery(
    VersionDiffDocument,
    skipped
      ? skipToken
      : {
          variables: { agentId, fromId, toId },
          fetchPolicy: 'cache-and-network',
          notifyOnNetworkStatusChange: true,
        },
  );
  const diff = useMemo(
    () => (skipped || data === undefined ? null : toFlowDiff(data.agentVersionDiff)),
    [skipped, data],
  );
  return {
    diff,
    loading: loading && diff === null,
    failed: !loading && error !== undefined && diff === null,
    retry: () => void refetch().catch(() => undefined),
  };
}
