import { useQuery } from '@apollo/client/react';
import { useCallback, useMemo } from 'react';
import { WorkspaceUsageDocument } from '@/features/settings/communication/gql/query/workspaceUsage.generated';
import { toWorkspaceUsage } from '@/features/settings/communication/helpers/usage.helpers';
import type { UseWorkspaceUsageResult } from '@/features/settings/typedefs/usage.typedefs';

export function useWorkspaceUsage(): UseWorkspaceUsageResult {
  const { data, loading, error, refetch } = useQuery(WorkspaceUsageDocument, {
    fetchPolicy: 'cache-and-network',
  });
  const usage = useMemo(() => toWorkspaceUsage(data), [data]);
  const retry = useCallback(async () => {
    await refetch();
  }, [refetch]);
  return { usage, loading, failed: error !== undefined && usage === null, retry };
}
