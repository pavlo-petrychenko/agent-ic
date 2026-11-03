import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  KNOWLEDGE_EMBEDDING_DIMENSIONS,
  KnowledgeSourceKind,
} from '@/modules/knowledge/constants/knowledge.constants';
import { KnowledgeBaseNotFoundError } from '@/modules/knowledge/errors/knowledge-base-not-found.error';
import { ChunkTermsRepository } from '@/modules/knowledge/repositories/chunk-terms.repository';
import { ChunksRepository } from '@/modules/knowledge/repositories/chunks.repository';
import { SectionsRepository } from '@/modules/knowledge/repositories/sections.repository';
import { KnowledgeSearchService } from '@/modules/knowledge/services/knowledge-search.service';
import type { NewChunk } from '@/modules/knowledge/typedefs/chunk.typedefs';
import { EmbeddingGateway } from '@/platform/llm/gateways/embedding.gateway';
import type {
  EmbedOptions,
  EmbeddingResult,
} from '@/platform/llm/typedefs/embedding-gateway.typedefs';
import {
  TEST_CHUNK_CONTENT,
  TEST_DOCUMENT_TITLE,
  TEST_EMBEDDING_VECTOR,
  TEST_SECTION_PATH,
  TEST_SOURCE_TITLE,
} from '@test/support/constants/knowledge-testing.constants';
import { newChunk } from '@test/support/fixtures/knowledge.fixture';
import {
  createKnowledgeTestbed,
  publicKnowledgeDocumentId,
  publicKnowledgeSourceId,
  seedKnowledgeBase,
  seedKnowledgeDocument,
  seedKnowledgeSection,
  seedKnowledgeSource,
} from '@test/support/helpers/knowledge-testing.helpers';
import { ensureWorkspaceRow } from '@test/support/helpers/parent-rows.helpers';
import type { KnowledgeTestbed } from '@test/support/typedefs/knowledge-testing.typedefs';

class FakeEmbeddingGateway extends EmbeddingGateway {
  vector: readonly number[] = TEST_EMBEDDING_VECTOR;

  async embed(texts: readonly string[], options: EmbedOptions): Promise<EmbeddingResult> {
    return {
      vectors: texts.map(() => this.vector),
      model: options.model,
      dimensions: KNOWLEDGE_EMBEDDING_DIMENSIONS,
      tokens: texts.length,
    };
  }
}

const vector = (index: number | null): number[] =>
  Array.from({ length: KNOWLEDGE_EMBEDDING_DIMENSIONS }, (_, position) =>
    index !== null && position === index ? 1 : 0,
  );

interface SeededSearch {
  readonly workspaceId: string;
  readonly knowledgeBaseId: string;
  readonly sourceId: string;
  readonly documentId: string;
  readonly sectionId: string;
}

describe('KnowledgeSearchService', () => {
  let testbed: KnowledgeTestbed;
  let service: KnowledgeSearchService;
  let gateway: FakeEmbeddingGateway;

  beforeAll(async () => {
    gateway = new FakeEmbeddingGateway();
    testbed = await createKnowledgeTestbed([{ token: EmbeddingGateway, value: gateway }]);
    service = testbed.module.get(KnowledgeSearchService);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  const seed = async (): Promise<SeededSearch> => {
    const workspaceId = testbed.ids.generate();
    await ensureWorkspaceRow(testbed.module, workspaceId);
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    const sourceId = await seedKnowledgeSource(testbed, workspaceId, knowledgeBaseId);
    const documentId = await seedKnowledgeDocument(testbed, workspaceId, knowledgeBaseId, sourceId);
    const sectionId = await seedKnowledgeSection(testbed, workspaceId, knowledgeBaseId, documentId);
    return { workspaceId, knowledgeBaseId, sourceId, documentId, sectionId };
  };

  const insertChunk = async (
    seeded: SeededSearch,
    content: string,
    ordinal: number,
    embedding: readonly number[],
  ): Promise<string> => {
    const chunkId = testbed.ids.generate();
    const chunk: NewChunk = {
      ...newChunk(
        chunkId,
        seeded.workspaceId,
        seeded.knowledgeBaseId,
        seeded.documentId,
        seeded.sectionId,
      ),
      ordinal,
      content,
      indexText: content,
      embedding: [...embedding],
    };
    await testbed.tenants.run(seeded.workspaceId, () =>
      testbed.module.get(ChunksRepository).insert(chunk),
    );
    await testbed.tenants.run(seeded.workspaceId, () =>
      testbed.module.get(ChunkTermsRepository).insert({
        workspaceId: seeded.workspaceId,
        kbId: seeded.knowledgeBaseId,
        chunkId,
        term: 'refund',
        frequency: 1,
      }),
    );
    return chunkId;
  };

  it('returns the best section with source, path and text', async () => {
    const seeded = await seed();
    await testbed.tenants.run(seeded.workspaceId, () =>
      testbed.module.get(SectionsRepository).update(seeded.workspaceId, seeded.sectionId, {
        content: TEST_CHUNK_CONTENT,
        tokenCount: 10,
      }),
    );
    await insertChunk(seeded, TEST_CHUNK_CONTENT, 0, vector(0));

    const results = await service.search({
      workspaceId: seeded.workspaceId,
      knowledgeBaseId: seeded.knowledgeBaseId,
      query: 'refund',
      topK: 3,
    });

    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({
      documentId: publicKnowledgeDocumentId(testbed, seeded.documentId),
      documentTitle: TEST_DOCUMENT_TITLE,
      sourceId: publicKnowledgeSourceId(testbed, seeded.sourceId),
      sourceTitle: TEST_SOURCE_TITLE,
      sourceKind: KnowledgeSourceKind.Upload,
      path: TEST_SECTION_PATH,
      text: TEST_CHUNK_CONTENT,
      score: expect.any(Number),
      url: null,
    });
    expect(results[0]?.score).toBeGreaterThan(0);
  });

  it('expands a large section with the matching chunk neighbours', async () => {
    const seeded = await seed();
    await testbed.tenants.run(seeded.workspaceId, () =>
      testbed.module.get(SectionsRepository).update(seeded.workspaceId, seeded.sectionId, {
        content: 'The whole large section.',
        tokenCount: 2000,
      }),
    );
    await insertChunk(seeded, 'First chunk', 0, vector(1));
    await insertChunk(seeded, 'Second chunk', 1, vector(0));
    await insertChunk(seeded, 'Third chunk', 2, vector(1));
    await insertChunk(seeded, 'Far chunk', 3, vector(1));
    gateway.vector = vector(0);

    const results = await service.search({
      workspaceId: seeded.workspaceId,
      knowledgeBaseId: seeded.knowledgeBaseId,
      query: 'refund',
      topK: 3,
    });

    expect(results).toHaveLength(1);
    expect(results[0]?.text).toContain('First chunk');
    expect(results[0]?.text).toContain('Second chunk');
    expect(results[0]?.text).toContain('Third chunk');
    expect(results[0]?.text).not.toContain('Far chunk');
  });

  it('returns no results when the only document is not indexed', async () => {
    const seeded = await seed();
    await testbed.tenants.run(seeded.workspaceId, () =>
      testbed.module.get(ChunksRepository).deleteByDocument(seeded.workspaceId, seeded.documentId),
    );

    const results = await service.search({
      workspaceId: seeded.workspaceId,
      knowledgeBaseId: seeded.knowledgeBaseId,
      query: 'refund',
      topK: 3,
    });

    expect(results).toEqual([]);
  });

  it('rejects a missing knowledge base', async () => {
    const seeded = await seed();

    await expect(
      service.search({
        workspaceId: seeded.workspaceId,
        knowledgeBaseId: testbed.ids.generate(),
        query: 'refund',
        topK: 3,
      }),
    ).rejects.toBeInstanceOf(KnowledgeBaseNotFoundError);
  });
});
