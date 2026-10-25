import type { CreateKnowledgeBaseMutation } from '@/features/knowledge/communication/gql/mutation/createKnowledgeBase.generated';
import type { KnowledgeBasesQuery } from '@/features/knowledge/communication/gql/query/knowledgeBases.generated';
import type { KnowledgeBase } from '@/features/knowledge/typedefs/knowledgeBase.typedefs';

export const toKnowledgeBases = (data: KnowledgeBasesQuery): KnowledgeBase[] =>
  data.knowledgeBases.map((knowledgeBase) => ({ ...knowledgeBase }));

export const toCreatedKnowledgeBase = (data: CreateKnowledgeBaseMutation): KnowledgeBase => ({
  ...data.createKnowledgeBase,
});
