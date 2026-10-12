import { skipToken, useQuery } from '@apollo/client/react';
import { useCallback, useMemo } from 'react';
import { TestingVersionsDocument } from '@/features/testing/communication/gql/query/testingVersions.generated';
import {
  hasBlockingIssues,
  toFlow,
  toTestingVersions,
} from '@/features/testing/communication/helpers/version.helpers';
import type { TestingVersionsResult } from '@/features/testing/typedefs/testing.typedefs';

export function useTestingVersions(agentId: string | null): TestingVersionsResult {
  const { data, loading, error, refetch } = useQuery(
    TestingVersionsDocument,
    agentId === null
      ? skipToken
      : { variables: { agentId }, fetchPolicy: 'network-only', notifyOnNetworkStatusChange: true },
  );
  const versions = useMemo(
    () => (data === undefined ? [] : toTestingVersions(data.agentVersions)),
    [data],
  );
  const draftFlow = useMemo(
    () => (data === undefined ? null : toFlow(data.agentDraft.version.flow)),
    [data],
  );
  const retry = useCallback(() => void refetch(), [refetch]);
  return {
    versions,
    draftFlow,
    draftBroken: data !== undefined && hasBlockingIssues(data.agentDraft),
    draftChangeCount: data?.agent.draftChangeCount ?? null,
    loading: agentId !== null && data === undefined && (loading || error === undefined),
    failed: !loading && error !== undefined && data === undefined,
    retry,
  };
}
