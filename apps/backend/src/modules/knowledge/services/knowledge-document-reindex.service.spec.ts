import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  KnowledgeDocumentStatus,
  KnowledgeSourceStatus,
} from '@/modules/knowledge/constants/knowledge.constants';
import { KNOWLEDGE_EMBEDDING_DIMENSIONS } from '@/modules/knowledge/constants/knowledge.constants';
import { ChunksRepository } from '@/modules/knowledge/repositories/chunks.repository';
import { DocumentsRepository } from '@/modules/knowledge/repositories/documents.repository';
import { SectionsRepository } from '@/modules/knowledge/repositories/sections.repository';
import { SourcesRepository } from '@/modules/knowledge/repositories/sources.repository';
import { KnowledgeDocumentReindexService } from '@/modules/knowledge/services/knowledge-document-reindex.service';
import { ReindexKnowledgeDocumentUseCase } from '@/modules/knowledge/use-cases/reindex-knowledge-document.use-case';
import { LlmUnavailableError } from '@/platform/llm/errors/llm-unavailable.error';
import { EmbeddingGateway } from '@/platform/llm/gateways/embedding.gateway';
import type {
  EmbedOptions,
  EmbeddingResult,
} from '@/platform/llm/typedefs/embedding-gateway.typedefs';
import { JOB_ATTEMPTS } from '@/platform/queues/constants/queue.constants';
import {
  TEST_EMBEDDING_VECTOR,
  TEST_SECTION_PATH,
} from '@test/support/constants/knowledge-testing.constants';
import { workspaceSystemCtx } from '@test/support/fixtures/conversation.fixture';
import {
  createKnowledgeTestbed,
  seedKnowledgeBase,
  seedKnowledgeChunk,
  seedKnowledgeDocument,
  seedKnowledgeSection,
  seedKnowledgeSource,
} from '@test/support/helpers/knowledge-testing.helpers';
import type { KnowledgeTestbed } from '@test/support/typedefs/knowledge-testing.typedefs';

const NEW_SUMMARY = 'A refund policy with a ten-day processing window.';

class FakeEmbeddingGateway extends EmbeddingGateway {
  readonly calls: string[][] = [];
  fail = false;

  async embed(texts: readonly string[], options: EmbedOptions): Promise<EmbeddingResult> {
    this.calls.push([...texts]);
    if (this.fail) {
      throw new LlmUnavailableError([options.model], [new Error('embeddings unavailable')]);
    }
    return {
      vectors: texts.map(() => TEST_EMBEDDING_VECTOR),
      model: options.model,
      dimensions: KNOWLEDGE_EMBEDDING_DIMENSIONS,
      tokens: texts.length * 10,
    };
  }
}

describe('KnowledgeDocumentReindexService', () => {
  let testbed: KnowledgeTestbed;
  let reindex: KnowledgeDocumentReindexService;
  let reindexUseCase: ReindexKnowledgeDocumentUseCase;
  let documents: DocumentsRepository;
  let sections: SectionsRepository;
  let chunks: ChunksRepository;
  let sources: SourcesRepository;
  let embeddings: FakeEmbeddingGateway;

  beforeAll(async () => {
    embeddings = new FakeEmbeddingGateway();
    testbed = await createKnowledgeTestbed([{ token: EmbeddingGateway, value: embeddings }]);
    reindex = testbed.module.get(KnowledgeDocumentReindexService);
    reindexUseCase = testbed.module.get(ReindexKnowledgeDocumentUseCase);
    documents = testbed.module.get(DocumentsRepository);
    sections = testbed.module.get(SectionsRepository);
    chunks = testbed.module.get(ChunksRepository);
    sources = testbed.module.get(SourcesRepository);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  const seedIndexingDocument = async (workspaceId: string) => {
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    const sourceId = await seedKnowledgeSource(testbed, workspaceId, knowledgeBaseId, {
      status: KnowledgeSourceStatus.Ready,
    });
    const documentId = await seedKnowledgeDocument(testbed, workspaceId, knowledgeBaseId, sourceId);
    const sectionId = await seedKnowledgeSection(testbed, workspaceId, knowledgeBaseId, documentId);
    const chunkId = await seedKnowledgeChunk(
      testbed,
      workspaceId,
      knowledgeBaseId,
      documentId,
      sectionId,
    );
    await testbed.tenants.run(workspaceId, async () => {
      await sections.update(workspaceId, sectionId, { generation: 1 });
      await chunks.update(workspaceId, chunkId, { generation: 1 });
      await documents.update(workspaceId, documentId, {
        title: 'Handbook',
        summary: NEW_SUMMARY,
        status: KnowledgeDocumentStatus.Indexing,
        activeGeneration: 1,
      });
    });
    return { documentId };
  };

  it('rebuilds index text and embeddings under a new generation', async () => {
    const workspaceId = testbed.ids.generate();
    const { documentId } = await seedIndexingDocument(workspaceId);
    embeddings.calls.length = 0;

    await reindex.reindex({ workspaceId, documentId });
    const stored = await testbed.tenants.run(workspaceId, async () => ({
      document: await documents.findById(workspaceId, documentId),
      sections: await sections.listByDocumentGeneration(workspaceId, documentId, 2),
      chunks: await chunks.listByDocumentGeneration(workspaceId, documentId, 2),
    }));

    expect(embeddings.calls).toHaveLength(1);
    expect(embeddings.calls[0]?.[0]).toContain(NEW_SUMMARY);
    expect(embeddings.calls[0]?.[0]).toContain(TEST_SECTION_PATH);
    expect(stored.document).toMatchObject({
      activeGeneration: 2,
      chunkCount: 1,
      status: KnowledgeDocumentStatus.Indexed,
      errorCode: null,
      summary: NEW_SUMMARY,
    });
    expect(stored.sections).toHaveLength(1);
    expect(stored.chunks).toHaveLength(1);
    expect(stored.chunks[0]?.indexText).toContain(NEW_SUMMARY);
    expect(stored.chunks[0]?.indexText).toContain(TEST_SECTION_PATH);
  });

  it('leaves a document that is no longer indexing untouched', async () => {
    const workspaceId = testbed.ids.generate();
    const { documentId } = await seedIndexingDocument(workspaceId);
    await testbed.tenants.run(workspaceId, () =>
      documents.update(workspaceId, documentId, {
        status: KnowledgeDocumentStatus.Indexed,
      }),
    );
    embeddings.calls.length = 0;

    await reindex.reindex({ workspaceId, documentId });

    expect(embeddings.calls).toHaveLength(0);
  });

  it('marks the document and source as failed after the final attempt', async () => {
    const workspaceId = testbed.ids.generate();
    const { documentId } = await seedIndexingDocument(workspaceId);
    embeddings.fail = true;

    await expect(
      reindexUseCase.execute(
        { ...workspaceSystemCtx(workspaceId), jobAttempt: JOB_ATTEMPTS },
        { documentId },
      ),
    ).rejects.toBeInstanceOf(LlmUnavailableError);
    embeddings.fail = false;

    const stored = await testbed.tenants.run(workspaceId, async () => {
      const document = await documents.findById(workspaceId, documentId);
      const source =
        document === null ? null : await sources.findById(workspaceId, document.sourceId);
      return { document, source };
    });

    expect(stored.document).toMatchObject({
      status: KnowledgeDocumentStatus.Error,
      errorCode: 'LLM_UNAVAILABLE',
    });
    expect(stored.source).toMatchObject({
      status: KnowledgeSourceStatus.Error,
      lastErrorCode: 'LLM_UNAVAILABLE',
    });
  });
});
