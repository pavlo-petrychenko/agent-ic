import { KNOWLEDGE_EMBEDDING_MODEL_MISSING_MESSAGE } from '@/modules/knowledge/constants/knowledge-embedding.constants';
import { EmbeddingModelId } from '@/platform/llm/constants/llm-model.constants';

export const knowledgeEmbeddingModel = (model: string): EmbeddingModelId => {
  const match = Object.values(EmbeddingModelId).find((candidate) => candidate === model);
  if (match === undefined) {
    throw new Error(KNOWLEDGE_EMBEDDING_MODEL_MISSING_MESSAGE);
  }
  return match;
};
