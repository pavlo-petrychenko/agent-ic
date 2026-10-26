import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  KnowledgeDocumentStatus,
  KnowledgeSourceStatus,
  KnowledgeSummarySource,
  KnowledgeSyncStatus,
} from '@/modules/knowledge/constants/knowledge.constants';
import { KNOWLEDGE_EMBEDDING_DIMENSIONS } from '@/modules/knowledge/constants/knowledge.constants';
import {
  knowledgeContentStorageKey,
  knowledgeOriginalStorageKey,
} from '@/modules/knowledge/helpers/knowledge-storage.helpers';
import { DocumentsRepository } from '@/modules/knowledge/repositories/documents.repository';
import { KnowledgeBasesRepository } from '@/modules/knowledge/repositories/knowledge-bases.repository';
import { SourcesRepository } from '@/modules/knowledge/repositories/sources.repository';
import { SyncRunsRepository } from '@/modules/knowledge/repositories/sync-runs.repository';
import { IngestKnowledgeSourceUseCase } from '@/modules/knowledge/use-cases/ingest-knowledge-source.use-case';
import { EmbeddingGateway } from '@/platform/llm/gateways/embedding.gateway';
import { LlmGateway } from '@/platform/llm/gateways/llm.gateway';
import type {
  EmbedOptions,
  EmbeddingResult,
} from '@/platform/llm/typedefs/embedding-gateway.typedefs';
import type {
  LlmAgentResult,
  LlmCompleteRequest,
  LlmCompletion,
} from '@/platform/llm/typedefs/llm-gateway.typedefs';
import { TEST_EMBEDDING_VECTOR } from '@test/support/constants/knowledge-testing.constants';
import { workspaceSystemCtx } from '@test/support/fixtures/conversation.fixture';
import { newSyncRun } from '@test/support/fixtures/knowledge.fixture';
import {
  createKnowledgeTestbed,
  seedKnowledgeBase,
  seedKnowledgeDocument,
  seedKnowledgeSource,
} from '@test/support/helpers/knowledge-testing.helpers';
import type { KnowledgeTestbed } from '@test/support/typedefs/knowledge-testing.typedefs';

const SUMMARY = 'A refund policy with a five-day processing window.';

class FakeLlmGateway extends LlmGateway {
  calls = 0;
  fail = false;

  async complete<T>(request: LlmCompleteRequest<T>): Promise<LlmCompletion<T>> {
    this.calls += 1;
    if (this.fail) {
      throw new Error('summary unavailable');
    }
    return {
      output: { summary: SUMMARY } as T,
      model: request.model,
      usage: { inputTokens: 10, outputTokens: 4 },
    };
  }

  async runAgent<T>(): Promise<LlmAgentResult<T>> {
    throw new Error('not used');
  }
}

class FakeEmbeddingGateway extends EmbeddingGateway {
  readonly calls: string[][] = [];

  async embed(texts: readonly string[], options: EmbedOptions): Promise<EmbeddingResult> {
    this.calls.push([...texts]);
    return {
      vectors: texts.map(() => TEST_EMBEDDING_VECTOR),
      model: options.model,
      dimensions: KNOWLEDGE_EMBEDDING_DIMENSIONS,
      tokens: texts.length * 10,
    };
  }
}

describe('IngestKnowledgeSourceUseCase', () => {
  let testbed: KnowledgeTestbed;
  let llm: FakeLlmGateway;
  let embedding: FakeEmbeddingGateway;
  let ingest: IngestKnowledgeSourceUseCase;
  let documents: DocumentsRepository;
  let sources: SourcesRepository;
  let knowledgeBases: KnowledgeBasesRepository;
  let syncRuns: SyncRunsRepository;

  beforeAll(async () => {
    llm = new FakeLlmGateway();
    embedding = new FakeEmbeddingGateway();
    testbed = await createKnowledgeTestbed([
      { token: LlmGateway, value: llm },
      { token: EmbeddingGateway, value: embedding },
    ]);
    ingest = testbed.module.get(IngestKnowledgeSourceUseCase);
    documents = testbed.module.get(DocumentsRepository);
    sources = testbed.module.get(SourcesRepository);
    knowledgeBases = testbed.module.get(KnowledgeBasesRepository);
    syncRuns = testbed.module.get(SyncRunsRepository);
  });

  afterEach(() => {
    llm.fail = false;
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('parses, summarizes, embeds and flips one upload document', async () => {
    const workspaceId = testbed.ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    const sourceId = await seedKnowledgeSource(testbed, workspaceId, knowledgeBaseId);
    const documentId = await seedKnowledgeDocument(testbed, workspaceId, knowledgeBaseId, sourceId);
    const syncRunId = testbed.ids.generate();
    const markdown = '# Refunds\n\nRefunds are processed within five days.\n';
    const originalKey = knowledgeOriginalStorageKey(workspaceId, documentId, 'refunds.md');
    await testbed.storage.put(originalKey, Buffer.from(markdown), 'text/markdown');
    await testbed.tenants.run(workspaceId, async () => {
      await documents.update(workspaceId, documentId, {
        title: 'Refunds',
        mimeType: 'text/markdown',
        sizeBytes: Buffer.byteLength(markdown),
        originalStorageKey: originalKey,
      });
      await syncRuns.insert(newSyncRun(syncRunId, workspaceId, sourceId));
    });

    await ingest.execute(workspaceSystemCtx(workspaceId), { sourceId });

    const document = await testbed.tenants.run(workspaceId, () =>
      documents.findById(workspaceId, documentId),
    );
    const source = await testbed.tenants.run(workspaceId, () =>
      sources.findById(workspaceId, sourceId),
    );
    const knowledgeBase = await testbed.tenants.run(workspaceId, () =>
      knowledgeBases.findById(workspaceId, knowledgeBaseId),
    );
    const syncRun = await testbed.tenants.run(workspaceId, () =>
      syncRuns.findById(workspaceId, syncRunId),
    );
    const contentKey = knowledgeContentStorageKey(workspaceId, documentId);

    expect(document).toMatchObject({
      status: KnowledgeDocumentStatus.Indexed,
      activeGeneration: 1,
      summary: SUMMARY,
      summarySource: KnowledgeSummarySource.Auto,
      contentHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      contentStorageKey: contentKey,
    });
    expect(document?.chunkCount).toBeGreaterThan(0);
    expect(document?.tokenCount).toBeGreaterThan(0);
    expect(source).toMatchObject({
      status: KnowledgeSourceStatus.Ready,
      documentCount: 1,
      chunkCount: document?.chunkCount,
    });
    expect(knowledgeBase).toMatchObject({
      documentCount: 1,
      chunkCount: document?.chunkCount,
    });
    expect(syncRun).toMatchObject({
      status: KnowledgeSyncStatus.Succeeded,
      documentsTotal: 1,
      documentsIndexed: 1,
      documentsFailed: 0,
    });
    expect(testbed.storage.objects.get(contentKey)?.body.toString()).toBe(markdown);
    expect(llm.calls).toBe(1);
    expect(embedding.calls).toHaveLength(1);

    await ingest.execute(workspaceSystemCtx(workspaceId), { sourceId });

    const skipped = await testbed.tenants.run(workspaceId, () =>
      documents.findById(workspaceId, documentId),
    );
    expect(skipped).toMatchObject({
      status: KnowledgeDocumentStatus.Indexed,
      activeGeneration: 1,
      contentHash: document?.contentHash,
    });
    expect(llm.calls).toBe(1);
    expect(embedding.calls).toHaveLength(1);
  });

  it('keeps the document searchable when the summary call fails', async () => {
    llm.fail = true;
    const workspaceId = testbed.ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    const sourceId = await seedKnowledgeSource(testbed, workspaceId, knowledgeBaseId);
    const documentId = await seedKnowledgeDocument(testbed, workspaceId, knowledgeBaseId, sourceId);
    const markdown = '# Refunds\n\nRefunds are processed within five days.\n';
    const originalKey = knowledgeOriginalStorageKey(workspaceId, documentId, 'refunds.md');
    await testbed.storage.put(originalKey, Buffer.from(markdown), 'text/markdown');
    await testbed.tenants.run(workspaceId, () =>
      documents.update(workspaceId, documentId, {
        title: 'Refunds',
        mimeType: 'text/markdown',
        sizeBytes: Buffer.byteLength(markdown),
        originalStorageKey: originalKey,
      }),
    );

    await ingest.execute(workspaceSystemCtx(workspaceId), { sourceId });

    const document = await testbed.tenants.run(workspaceId, () =>
      documents.findById(workspaceId, documentId),
    );
    expect(document).toMatchObject({
      status: KnowledgeDocumentStatus.Indexed,
      summary: null,
      summarySource: null,
      activeGeneration: 1,
    });
    llm.fail = false;
  });

  it('marks a document and source as failed on a parse error without retrying the job', async () => {
    const workspaceId = testbed.ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    const sourceId = await seedKnowledgeSource(testbed, workspaceId, knowledgeBaseId);
    const documentId = await seedKnowledgeDocument(testbed, workspaceId, knowledgeBaseId, sourceId);
    const originalKey = knowledgeOriginalStorageKey(workspaceId, documentId, 'refunds.pdf');
    await testbed.storage.put(originalKey, Buffer.from('not a PDF'), 'application/pdf');
    const syncRunId = testbed.ids.generate();
    await testbed.tenants.run(workspaceId, async () => {
      await documents.update(workspaceId, documentId, {
        title: 'Refunds',
        mimeType: 'application/pdf',
        originalStorageKey: originalKey,
      });
      await syncRuns.insert(newSyncRun(syncRunId, workspaceId, sourceId));
    });

    await ingest.execute(workspaceSystemCtx(workspaceId), { sourceId });

    const document = await testbed.tenants.run(workspaceId, () =>
      documents.findById(workspaceId, documentId),
    );
    const source = await testbed.tenants.run(workspaceId, () =>
      sources.findById(workspaceId, sourceId),
    );
    const syncRun = await testbed.tenants.run(workspaceId, () =>
      syncRuns.findById(workspaceId, syncRunId),
    );
    expect(document).toMatchObject({
      status: KnowledgeDocumentStatus.Error,
      errorCode: 'DOCUMENT_SIGNATURE_MISMATCH',
    });
    expect(source).toMatchObject({
      status: KnowledgeSourceStatus.Error,
      documentCount: 0,
    });
    expect(syncRun).toMatchObject({
      status: KnowledgeSyncStatus.Failed,
      documentsFailed: 1,
    });
  });
});
