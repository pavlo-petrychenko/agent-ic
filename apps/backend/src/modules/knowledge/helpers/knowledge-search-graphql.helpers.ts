import { KnowledgeSourceKind } from '@/modules/knowledge/constants/knowledge.constants';
import type { KnowledgeSearchResult } from '@/modules/knowledge/typedefs/knowledge-search.typedefs';
import { KnowledgeSourceKind as GraphqlKnowledgeSourceKind } from '@/platform/graphql-server/generated/schema.generated';
import type { KnowledgeSearchResult as GraphqlKnowledgeSearchResult } from '@/platform/graphql-server/generated/schema.generated';

const KIND: Readonly<Record<KnowledgeSourceKind, GraphqlKnowledgeSourceKind>> = {
  [KnowledgeSourceKind.Upload]: GraphqlKnowledgeSourceKind.Upload,
  [KnowledgeSourceKind.GoogleDocs]: GraphqlKnowledgeSourceKind.GoogleDocs,
};

export const toGraphqlKnowledgeSearchResult = (
  result: KnowledgeSearchResult,
): GraphqlKnowledgeSearchResult => ({
  documentId: result.documentId,
  documentTitle: result.documentTitle,
  sourceId: result.sourceId,
  sourceTitle: result.sourceTitle,
  sourceKind: KIND[result.sourceKind],
  path: result.path,
  text: result.text,
  score: result.score,
  url: result.url,
});

export const toGraphqlKnowledgeSearchResults = (
  results: readonly KnowledgeSearchResult[],
): GraphqlKnowledgeSearchResult[] => results.map(toGraphqlKnowledgeSearchResult);
