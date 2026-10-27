import { describe, expect, it } from 'vitest';
import { KNOWLEDGE_EMBEDDING_MODEL_MISSING_MESSAGE } from '@/modules/knowledge/constants/knowledge-embedding.constants';
import { knowledgeEmbeddingModel } from '@/modules/knowledge/helpers/knowledge-embedding.helpers';
import { EmbeddingModelId } from '@/platform/llm/constants/llm-model.constants';

describe('knowledgeEmbeddingModel', () => {
  it('maps stored models to catalog ids', () => {
    expect(knowledgeEmbeddingModel('text-embedding-3-small')).toBe(
      EmbeddingModelId.TextEmbedding3Small,
    );
    expect(knowledgeEmbeddingModel('jina-embeddings-v5-text-small')).toBe(
      EmbeddingModelId.JinaEmbeddingsV5TextSmall,
    );
  });

  it('rejects an unknown model', () => {
    expect(() => knowledgeEmbeddingModel('unknown')).toThrow(
      KNOWLEDGE_EMBEDDING_MODEL_MISSING_MESSAGE,
    );
  });
});
