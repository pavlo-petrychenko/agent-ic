import { skipToken, useQuery } from '@apollo/client/react';
import { useMemo } from 'react';
import { TestingVersionsDocument } from '@/features/testing/communication/gql/query/testingVersions.generated';
import {
  hasBlockingIssues,
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
  return {
    versions,
    draftBroken: data !== undefined && hasBlockingIssues(data.agentDraft),
    loading: loading || (agentId !== null && data === undefined && error === undefined),
    failed: !loading && error !== undefined && data === undefined,
    retry: () => void refetch(),
  };
}
