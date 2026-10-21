import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';
import { LlmCatalogDocument } from '@/features/settings/communication/gql/query/llmCatalog.generated';
import { toPlatformPurposes } from '@/features/settings/communication/helpers/llmCatalog.helpers';
import type { UseLlmCatalogResult } from '@/features/settings/typedefs/llmKey.typedefs';

export function useLlmCatalog(): UseLlmCatalogResult {
  const { data, loading } = useQuery(LlmCatalogDocument);
  const purposes = useMemo(() => toPlatformPurposes(data), [data]);
  return { purposes, loading };
}
