import { useQuery } from '@apollo/client/react';
import { useCallback, useMemo } from 'react';
import { LlmKeysDocument } from '@/features/settings/communication/gql/query/llmKeys.generated';
import { toLlmKeys } from '@/features/settings/communication/helpers/llmKey.helpers';
import type { UseLlmKeysResult } from '@/features/settings/typedefs/llmKey.typedefs';

export function useLlmKeys(): UseLlmKeysResult {
  const { data, loading, error, refetch } = useQuery(LlmKeysDocument);
  const keys = useMemo(() => toLlmKeys(data), [data]);
  const retry = useCallback(() => {
    void refetch();
  }, [refetch]);
  return { keys, loading, failed: error !== undefined && data === undefined, retry };
}
