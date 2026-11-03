import type { SearchKnowledgeQuery } from '@/features/knowledge/communication/gql/query/searchKnowledge.generated';
import { KnowledgeSourceKind } from '@/features/knowledge/constants/knowledgeSource.constants';
import type { KnowledgeSearchResult } from '@/features/knowledge/typedefs/knowledgeSearch.typedefs';
import { KnowledgeSourceKind as GraphqlKnowledgeSourceKind } from '@/shared/api/generated/schema.generated';

const KIND: Readonly<Record<GraphqlKnowledgeSourceKind, KnowledgeSourceKind>> = {
  [GraphqlKnowledgeSourceKind.Upload]: KnowledgeSourceKind.Upload,
  [GraphqlKnowledgeSourceKind.GoogleDocs]: KnowledgeSourceKind.GoogleDocs,
};

export const toKnowledgeSearchResult = (
  result: SearchKnowledgeQuery['searchKnowledge'][number],
): KnowledgeSearchResult => ({
  ...result,
  sourceKind: KIND[result.sourceKind],
});

export const toKnowledgeSearchResults = (data: SearchKnowledgeQuery): KnowledgeSearchResult[] =>
  data.searchKnowledge.map(toKnowledgeSearchResult);
