import { useQuery } from '@apollo/client/react';
import { useCallback, useMemo } from 'react';
import { PromptVersionDocument } from '@/features/prompts/communication/gql/query/promptVersion.generated';
import { toPromptVersionDetail } from '@/features/prompts/communication/helpers/promptVersionDetail.helpers';
import type { UsePromptVersionResult } from '@/features/prompts/typedefs/prompt.typedefs';

export function usePromptVersion(versionId: string | null): UsePromptVersionResult {
  const { data, loading, error, refetch } = useQuery(PromptVersionDocument, {
    variables: { id: versionId ?? '' },
    skip: versionId === null,
    fetchPolicy: 'cache-and-network',
  });
  const version = useMemo(() => (data === undefined ? null : toPromptVersionDetail(data)), [data]);
  const retry = useCallback(() => refetch().then(() => undefined), [refetch]);

  return {
    version,
    loading: loading && version === null,
    failed: error !== undefined && version === null,
    retry,
  };
}
