import { useQuery } from '@apollo/client/react';
import { useCallback, useMemo } from 'react';
import { PromptUsagesDocument } from '@/features/prompts/communication/gql/query/promptUsages.generated';
import { toPromptUsageList } from '@/features/prompts/communication/helpers/promptUsage.helpers';
import type { UsePromptUsagesResult } from '@/features/prompts/typedefs/promptUsage.typedefs';

export function usePromptUsages(promptId: string): UsePromptUsagesResult {
  const { data, loading, error, refetch } = useQuery(PromptUsagesDocument, {
    variables: { promptId },
    fetchPolicy: 'cache-and-network',
  });
  const usages = useMemo(() => (data === undefined ? null : toPromptUsageList(data)), [data]);
  const retry = useCallback(() => refetch().then(() => undefined), [refetch]);

  return {
    usages,
    loading: loading && usages === null,
    failed: error !== undefined && usages === null,
    retry,
  };
}
