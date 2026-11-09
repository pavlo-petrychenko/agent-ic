import { useQuery } from '@apollo/client/react';
import { useCallback, useMemo } from 'react';
import { TemplateKnowledgeBasesDocument } from '@/features/agents/communication/gql/query/templateKnowledgeBases.generated';
import { toTemplateKnowledgeBases } from '@/features/agents/communication/helpers/templateKnowledgeBase.helpers';
import type { UseTemplateKnowledgeBasesResult } from '@/features/agents/typedefs/agentTemplate.typedefs';

export function useTemplateKnowledgeBases(skip: boolean): UseTemplateKnowledgeBasesResult {
  const { data, loading, error, refetch } = useQuery(TemplateKnowledgeBasesDocument, {
    fetchPolicy: 'cache-and-network',
    skip,
  });
  const knowledgeBases = useMemo(
    () => (data === undefined ? [] : toTemplateKnowledgeBases(data)),
    [data],
  );
  const retry = useCallback(() => refetch().then(() => undefined), [refetch]);

  return {
    knowledgeBases,
    loading: loading && data === undefined,
    failed: error !== undefined && data === undefined,
    retry,
  };
}
