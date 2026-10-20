import { useQuery } from '@apollo/client/react';
import { useCallback, useMemo } from 'react';
import { PromptVersionsDocument } from '@/features/prompts/communication/gql/query/promptVersions.generated';
import { toPromptVersionList } from '@/features/prompts/communication/helpers/promptVersions.helpers';
import type { UsePromptVersionsResult } from '@/features/prompts/typedefs/prompt.typedefs';

export function usePromptVersions(promptId: string): UsePromptVersionsResult {
  const { data, loading, error, refetch } = useQuery(PromptVersionsDocument, {
    variables: { promptId },
    fetchPolicy: 'cache-and-network',
  });
  const versions = useMemo(() => (data === undefined ? null : toPromptVersionList(data)), [data]);
  const retry = useCallback(() => refetch().then(() => undefined), [refetch]);

  return {
    versions,
    loading: loading && versions === null,
    failed: error !== undefined && versions === null,
    retry,
  };
}
