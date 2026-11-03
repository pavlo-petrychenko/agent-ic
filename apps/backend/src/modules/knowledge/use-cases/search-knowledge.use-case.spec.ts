import { IdPrefix, WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { KNOWLEDGE_EMBEDDING_DIMENSIONS } from '@/modules/knowledge/constants/knowledge.constants';
import { InvalidKnowledgeInputError } from '@/modules/knowledge/errors/invalid-knowledge-input.error';
import { SearchKnowledgeUseCase } from '@/modules/knowledge/use-cases/search-knowledge.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { EmbeddingGateway } from '@/platform/llm/gateways/embedding.gateway';
import type {
  EmbedOptions,
  EmbeddingResult,
} from '@/platform/llm/typedefs/embedding-gateway.typedefs';
import { TEST_EMBEDDING_VECTOR } from '@test/support/constants/knowledge-testing.constants';
import {
  createKnowledgeTestbed,
  knowledgeCtx,
} from '@test/support/helpers/knowledge-testing.helpers';
import type { KnowledgeTestbed } from '@test/support/typedefs/knowledge-testing.typedefs';

class FakeEmbeddingGateway extends EmbeddingGateway {
  async embed(texts: readonly string[], options: EmbedOptions): Promise<EmbeddingResult> {
    return {
      vectors: texts.map(() => TEST_EMBEDDING_VECTOR),
      model: options.model,
      dimensions: KNOWLEDGE_EMBEDDING_DIMENSIONS,
      tokens: texts.length,
    };
  }
}

describe('SearchKnowledgeUseCase', () => {
  let testbed: KnowledgeTestbed;
  let useCase: SearchKnowledgeUseCase;

  beforeAll(async () => {
    testbed = await createKnowledgeTestbed([
      { token: EmbeddingGateway, value: new FakeEmbeddingGateway() },
    ]);
    useCase = testbed.module.get(SearchKnowledgeUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('denies a role without knowledge access before reading input', async () => {
    const workspaceId = testbed.ids.generate();

    await expect(
      useCase.execute(knowledgeCtx(workspaceId, WorkspaceRole.Operator), {
        knowledgeBaseId: testbed.ids.toPublic(IdPrefix.KnowledgeBase, testbed.ids.generate()),
        query: 'refund',
      }),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
  });

  it('rejects an empty query', async () => {
    const workspaceId = testbed.ids.generate();

    await expect(
      useCase.execute(knowledgeCtx(workspaceId), {
        knowledgeBaseId: testbed.ids.toPublic(IdPrefix.KnowledgeBase, testbed.ids.generate()),
        query: '   ',
      }),
    ).rejects.toBeInstanceOf(InvalidKnowledgeInputError);
  });
});
