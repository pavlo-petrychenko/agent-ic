import type { KnowledgeBaseView } from '@/modules/knowledge/typedefs/knowledge-base.typedefs';
import type { KnowledgeBase as GraphqlKnowledgeBase } from '@/platform/graphql-server/generated/schema.generated';

export const toGraphqlKnowledgeBase = (knowledgeBase: KnowledgeBaseView): GraphqlKnowledgeBase => ({
  id: knowledgeBase.id,
  name: knowledgeBase.name,
  description: knowledgeBase.description,
  toolName: knowledgeBase.toolName,
  toolDescription: knowledgeBase.toolDescription,
  documentCount: knowledgeBase.documentCount,
  chunkCount: knowledgeBase.chunkCount,
  createdAt: knowledgeBase.createdAt.toISOString(),
  updatedAt: knowledgeBase.updatedAt.toISOString(),
});

export const toGraphqlKnowledgeBases = (
  knowledgeBases: readonly KnowledgeBaseView[],
): GraphqlKnowledgeBase[] => knowledgeBases.map(toGraphqlKnowledgeBase);
