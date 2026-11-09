import { skipToken, useQuery } from '@apollo/client/react';
import { useCallback, useMemo } from 'react';
import { BuilderVersionsDocument } from '@/features/flow-builder/communication/gql/query/builderVersions.generated';
import { toBuilderVersions } from '@/features/flow-builder/communication/helpers/versions.helpers';
import type { BuilderVersionsResult } from '@/features/flow-builder/typedefs/versions.typedefs';

export function useBuilderVersions(agentId: string, open: boolean): BuilderVersionsResult {
  const { data, loading, error, refetch } = useQuery(
    BuilderVersionsDocument,
    open
      ? { variables: { agentId }, fetchPolicy: 'network-only', notifyOnNetworkStatusChange: true }
      : skipToken,
  );
  const versions = useMemo(() => (data === undefined ? null : toBuilderVersions(data)), [data]);
  const retry = useCallback(() => void refetch().catch(() => undefined), [refetch]);
  return {
    versions,
    loading: open && versions === null && (loading || error === undefined),
    failed: !loading && error !== undefined && versions === null,
    retry,
  };
}
