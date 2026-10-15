import { useQuery } from '@apollo/client/react';
import { useCallback, useMemo } from 'react';
import { PromptLibraryDocument } from '@/features/prompts/communication/gql/query/promptLibrary.generated';
import { toPromptLibrary } from '@/features/prompts/communication/helpers/promptLibrary.helpers';
import type { UsePromptLibraryResult } from '@/features/prompts/typedefs/prompt.typedefs';

export function usePromptLibrary(): UsePromptLibraryResult {
  const { data, loading, error, refetch } = useQuery(PromptLibraryDocument, {
    fetchPolicy: 'cache-and-network',
  });
  const library = useMemo(() => (data === undefined ? null : toPromptLibrary(data)), [data]);
  const retry = useCallback(() => refetch().then(() => undefined), [refetch]);

  return {
    folders: library?.folders ?? [],
    loading: loading && library === null,
    failed: error !== undefined && library === null,
    retry,
  };
}
