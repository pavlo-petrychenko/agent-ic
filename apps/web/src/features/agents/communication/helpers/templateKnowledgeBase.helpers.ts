import type { TemplateKnowledgeBasesQuery } from '@/features/agents/communication/gql/query/templateKnowledgeBases.generated';
import type { TemplateKnowledgeBase } from '@/features/agents/typedefs/agentTemplate.typedefs';

export const toTemplateKnowledgeBases = (
  data: TemplateKnowledgeBasesQuery,
): TemplateKnowledgeBase[] =>
  data.knowledgeBases.map((knowledgeBase) => ({
    id: knowledgeBase.id,
    name: knowledgeBase.name,
    documentCount: knowledgeBase.documentCount,
  }));
