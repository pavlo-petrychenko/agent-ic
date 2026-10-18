import { useQuery } from '@apollo/client/react';
import { useCallback, useMemo } from 'react';
import { PromptDetailDocument } from '@/features/prompts/communication/gql/query/promptDetail.generated';
import { toPromptDetail } from '@/features/prompts/communication/helpers/promptDetail.helpers';
import type { UsePromptDetailResult } from '@/features/prompts/typedefs/prompt.typedefs';

export function usePromptDetail(promptId: string): UsePromptDetailResult {
  const { data, loading, error, refetch } = useQuery(PromptDetailDocument, {
    variables: { id: promptId },
    fetchPolicy: 'cache-and-network',
  });
  const detail = useMemo(() => (data === undefined ? null : toPromptDetail(data)), [data]);
  const retry = useCallback(() => refetch().then(() => undefined), [refetch]);

  return {
    detail,
    loading: loading && detail === null,
    failed: error !== undefined && detail === null,
    retry,
  };
}
