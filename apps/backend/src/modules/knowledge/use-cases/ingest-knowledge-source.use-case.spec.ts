import { KNOWLEDGE_DOCUMENT_TITLE_MAX_LENGTH } from '@agent-ic/contracts';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  DOCUMENT_TITLE_TRUNCATED_MESSAGE,
  DocumentParseWarningCode,
} from '@/modules/knowledge/constants/document-parser.constants';
import {
  KnowledgeDocumentStatus,
  KnowledgeSourceKind,
  KnowledgeSourceStatus,
  KnowledgeSummarySource,
  KnowledgeSyncStatus,
} from '@/modules/knowledge/constants/knowledge.constants';
import { KNOWLEDGE_EMBEDDING_DIMENSIONS } from '@/modules/knowledge/constants/knowledge.constants';
import { GoogleDriveGateway } from '@/modules/knowledge/gateways/google-drive.gateway';
import { GoogleOAuthGateway } from '@/modules/knowledge/gateways/google-oauth.gateway';
import {
  knowledgeContentStorageKey,
  knowledgeOriginalStorageKey,
} from '@/modules/knowledge/helpers/knowledge-storage.helpers';
import { ConnectionsRepository } from '@/modules/knowledge/repositories/connections.repository';
import { DocumentsRepository } from '@/modules/knowledge/repositories/documents.repository';
import { KnowledgeBasesRepository } from '@/modules/knowledge/repositories/knowledge-bases.repository';
import { SourcesRepository } from '@/modules/knowledge/repositories/sources.repository';
import { SyncRunsRepository } from '@/modules/knowledge/repositories/sync-runs.repository';
import { IngestKnowledgeSourceUseCase } from '@/modules/knowledge/use-cases/ingest-knowledge-source.use-case';
import { LlmUnavailableError } from '@/platform/llm/errors/llm-unavailable.error';
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
import { JOB_ATTEMPTS } from '@/platform/queues/constants/queue.constants';
import { SecretBoxService } from '@/platform/secrets/services/secret-box.service';
import {
  TEST_EMBEDDING_VECTOR,
  TEST_GOOGLE_DOC_ID,
  TEST_GOOGLE_DOC_MARKDOWN,
  TEST_GOOGLE_DOC_MIME_TYPE,
  TEST_GOOGLE_DOC_MODIFIED_AT,
  TEST_GOOGLE_DOC_NAME,
  TEST_GOOGLE_DOC_URL,
  TEST_GOOGLE_DOC_VERSION,
  TEST_GOOGLE_REFRESH_TOKEN,
} from '@test/support/constants/knowledge-testing.constants';
import { FakeGoogleDriveGateway } from '@test/support/fakes/google-drive.fake';
import { FakeGoogleOAuthGateway } from '@test/support/fakes/google-oauth.fake';
import { workspaceSystemCtx } from '@test/support/fixtures/conversation.fixture';
import { newSyncRun } from '@test/support/fixtures/knowledge.fixture';
import {
  createKnowledgeTestbed,
  seedKnowledgeBase,
  seedKnowledgeConnection,
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

describe('IngestKnowledgeSourceUseCase', () => {
  let testbed: KnowledgeTestbed;
  let llm: FakeLlmGateway;
  let embedding: FakeEmbeddingGateway;
  let drive: FakeGoogleDriveGateway;
  let ingest: IngestKnowledgeSourceUseCase;
  let documents: DocumentsRepository;
  let sources: SourcesRepository;
  let knowledgeBases: KnowledgeBasesRepository;
  let syncRuns: SyncRunsRepository;
  let connections: ConnectionsRepository;
  let secrets: SecretBoxService;

  beforeAll(async () => {
    llm = new FakeLlmGateway();
    embedding = new FakeEmbeddingGateway();
    drive = new FakeGoogleDriveGateway();
    testbed = await createKnowledgeTestbed([
      { token: LlmGateway, value: llm },
      { token: EmbeddingGateway, value: embedding },
      { token: GoogleOAuthGateway, value: new FakeGoogleOAuthGateway() },
      { token: GoogleDriveGateway, value: drive },
    ]);
    ingest = testbed.module.get(IngestKnowledgeSourceUseCase);
    documents = testbed.module.get(DocumentsRepository);
    sources = testbed.module.get(SourcesRepository);
    knowledgeBases = testbed.module.get(KnowledgeBasesRepository);
    syncRuns = testbed.module.get(SyncRunsRepository);
    connections = testbed.module.get(ConnectionsRepository);
    secrets = testbed.module.get(SecretBoxService);
  });

  beforeEach(() => {
    llm.calls = 0;
    embedding.calls.length = 0;
    embedding.fail = false;
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
    const originalKey = knowledgeOriginalStorageKey(workspaceId, documentId, 'run-1', 'refunds.md');
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

    await ingest.execute(workspaceSystemCtx(workspaceId), { sourceId, syncRunId });

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
    const contentKey = knowledgeContentStorageKey(workspaceId, documentId, 1);

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

    await ingest.execute(workspaceSystemCtx(workspaceId), { sourceId, syncRunId });

    const skippedRunId = testbed.ids.generate();
    await testbed.tenants.run(workspaceId, () =>
      syncRuns.insert(newSyncRun(skippedRunId, workspaceId, sourceId)),
    );
    await ingest.execute(workspaceSystemCtx(workspaceId), { sourceId, syncRunId: skippedRunId });

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
    const skippedRun = await testbed.tenants.run(workspaceId, () =>
      syncRuns.findById(workspaceId, skippedRunId),
    );
    expect(skippedRun).toMatchObject({
      status: KnowledgeSyncStatus.Succeeded,
      documentsSkipped: 1,
      documentsIndexed: 0,
    });
  });

  it('exports a picked Google Doc in the worker before indexing it', async () => {
    const workspaceId = testbed.ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    const connectionId = await seedKnowledgeConnection(testbed, workspaceId);
    await testbed.tenants.run(workspaceId, () =>
      connections.update(workspaceId, connectionId, {
        sealedRefreshToken: secrets.seal(TEST_GOOGLE_REFRESH_TOKEN),
      }),
    );
    const sourceId = await seedKnowledgeSource(testbed, workspaceId, knowledgeBaseId, {
      kind: KnowledgeSourceKind.GoogleDocs,
      connectionId,
    });
    const documentId = await seedKnowledgeDocument(testbed, workspaceId, knowledgeBaseId, sourceId);
    drive.exportRequests.length = 0;
    drive.addFile(
      {
        id: TEST_GOOGLE_DOC_ID,
        name: TEST_GOOGLE_DOC_NAME,
        mimeType: TEST_GOOGLE_DOC_MIME_TYPE,
        webViewLink: TEST_GOOGLE_DOC_URL,
        modifiedTime: TEST_GOOGLE_DOC_MODIFIED_AT,
        version: TEST_GOOGLE_DOC_VERSION,
        trashed: false,
      },
      TEST_GOOGLE_DOC_MARKDOWN,
    );
    const syncRunId = testbed.ids.generate();
    await testbed.tenants.run(workspaceId, async () => {
      await documents.update(workspaceId, documentId, {
        externalId: TEST_GOOGLE_DOC_ID,
        title: TEST_GOOGLE_DOC_NAME,
        mimeType: TEST_GOOGLE_DOC_MIME_TYPE,
      });
      await syncRuns.insert(newSyncRun(syncRunId, workspaceId, sourceId));
    });

    await ingest.execute(workspaceSystemCtx(workspaceId), { sourceId, syncRunId });

    const document = await testbed.tenants.run(workspaceId, () =>
      documents.findById(workspaceId, documentId),
    );
    if (document?.originalStorageKey === null || document?.originalStorageKey === undefined) {
      throw new Error('the worker did not store the Google Doc original');
    }
    const source = await testbed.tenants.run(workspaceId, () =>
      sources.findById(workspaceId, sourceId),
    );
    expect(document).toMatchObject({
      status: KnowledgeDocumentStatus.Indexed,
      title: TEST_GOOGLE_DOC_NAME,
      sizeBytes: Buffer.byteLength(TEST_GOOGLE_DOC_MARKDOWN),
      sourceUrl: TEST_GOOGLE_DOC_URL,
      providerVersion: TEST_GOOGLE_DOC_VERSION,
      providerModifiedAt: new Date(TEST_GOOGLE_DOC_MODIFIED_AT),
    });
    expect(testbed.storage.objects.get(document.originalStorageKey)?.body.toString()).toBe(
      TEST_GOOGLE_DOC_MARKDOWN,
    );
    expect(source).toMatchObject({
      status: KnowledgeSourceStatus.Ready,
      documentCount: 1,
    });
    expect(drive.exportRequests).toEqual([TEST_GOOGLE_DOC_ID]);
  });

  it('keeps the document searchable when the summary call fails', async () => {
    llm.fail = true;
    const workspaceId = testbed.ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    const sourceId = await seedKnowledgeSource(testbed, workspaceId, knowledgeBaseId);
    const documentId = await seedKnowledgeDocument(testbed, workspaceId, knowledgeBaseId, sourceId);
    const markdown = '# Refunds\n\nRefunds are processed within five days.\n';
    const originalKey = knowledgeOriginalStorageKey(workspaceId, documentId, 'run-1', 'refunds.md');
    const syncRunId = testbed.ids.generate();
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

    await ingest.execute(workspaceSystemCtx(workspaceId), { sourceId, syncRunId });

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
    const retryRunId = testbed.ids.generate();
    await testbed.tenants.run(workspaceId, () =>
      syncRuns.insert(newSyncRun(retryRunId, workspaceId, sourceId)),
    );
    await ingest.execute(workspaceSystemCtx(workspaceId), { sourceId, syncRunId: retryRunId });

    const retried = await testbed.tenants.run(workspaceId, () =>
      documents.findById(workspaceId, documentId),
    );
    expect(retried).toMatchObject({
      status: KnowledgeDocumentStatus.Indexed,
      summary: SUMMARY,
      summarySource: KnowledgeSummarySource.Auto,
      activeGeneration: 2,
    });
    expect(llm.calls).toBe(2);
    expect(embedding.calls).toHaveLength(2);
  });

  it('persists parser warnings on the indexed document', async () => {
    const workspaceId = testbed.ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    const sourceId = await seedKnowledgeSource(testbed, workspaceId, knowledgeBaseId);
    const documentId = await seedKnowledgeDocument(testbed, workspaceId, knowledgeBaseId, sourceId);
    const markdown = '# Refunds\n\nRefunds are processed within five days.\n';
    const originalKey = knowledgeOriginalStorageKey(workspaceId, documentId, 'run-1', 'refunds.md');
    const syncRunId = testbed.ids.generate();
    await testbed.storage.put(originalKey, Buffer.from(markdown), 'text/markdown');
    await testbed.tenants.run(workspaceId, async () => {
      await documents.update(workspaceId, documentId, {
        title: 'x'.repeat(KNOWLEDGE_DOCUMENT_TITLE_MAX_LENGTH + 1),
        mimeType: 'text/markdown',
        sizeBytes: Buffer.byteLength(markdown),
        originalStorageKey: originalKey,
      });
      await syncRuns.insert(newSyncRun(syncRunId, workspaceId, sourceId));
    });

    await ingest.execute(workspaceSystemCtx(workspaceId), { sourceId, syncRunId });

    const document = await testbed.tenants.run(workspaceId, () =>
      documents.findById(workspaceId, documentId),
    );
    expect(document?.title).toHaveLength(KNOWLEDGE_DOCUMENT_TITLE_MAX_LENGTH);
    expect(document?.warnings).toEqual([
      {
        code: DocumentParseWarningCode.TitleTruncated,
        message: DOCUMENT_TITLE_TRUNCATED_MESSAGE,
      },
    ]);
  });

  it('leaves the run open for a retryable failure and closes it on the last attempt', async () => {
    const workspaceId = testbed.ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    const sourceId = await seedKnowledgeSource(testbed, workspaceId, knowledgeBaseId);
    const documentId = await seedKnowledgeDocument(testbed, workspaceId, knowledgeBaseId, sourceId);
    const markdown = '# Refunds\n\nRefunds are processed within five days.\n';
    const originalKey = knowledgeOriginalStorageKey(workspaceId, documentId, 'run-1', 'refunds.md');
    const syncRunId = testbed.ids.generate();
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
    embedding.fail = true;

    await expect(
      ingest.execute(
        { ...workspaceSystemCtx(workspaceId), jobAttempt: 1 },
        { sourceId, syncRunId },
      ),
    ).rejects.toBeInstanceOf(LlmUnavailableError);

    const retryingSource = await testbed.tenants.run(workspaceId, () =>
      sources.findById(workspaceId, sourceId),
    );
    const retryingRun = await testbed.tenants.run(workspaceId, () =>
      syncRuns.findById(workspaceId, syncRunId),
    );
    const retryingDocument = await testbed.tenants.run(workspaceId, () =>
      documents.findById(workspaceId, documentId),
    );
    expect(retryingSource?.status).toBe(KnowledgeSourceStatus.Indexing);
    expect(retryingRun?.status).toBe(KnowledgeSyncStatus.Running);
    expect(retryingDocument?.status).toBe(KnowledgeDocumentStatus.Indexing);

    await expect(
      ingest.execute(
        { ...workspaceSystemCtx(workspaceId), jobAttempt: JOB_ATTEMPTS },
        { sourceId, syncRunId },
      ),
    ).rejects.toBeInstanceOf(LlmUnavailableError);

    const failedSource = await testbed.tenants.run(workspaceId, () =>
      sources.findById(workspaceId, sourceId),
    );
    const failedRun = await testbed.tenants.run(workspaceId, () =>
      syncRuns.findById(workspaceId, syncRunId),
    );
    const failedDocument = await testbed.tenants.run(workspaceId, () =>
      documents.findById(workspaceId, documentId),
    );
    expect(failedSource?.status).toBe(KnowledgeSourceStatus.Error);
    expect(failedRun).toMatchObject({
      status: KnowledgeSyncStatus.Failed,
      documentsFailed: 1,
    });
    expect(failedDocument?.status).toBe(KnowledgeDocumentStatus.Error);
  });

  it('promotes a pending replacement and deletes the old files after the flip', async () => {
    const workspaceId = testbed.ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    const sourceId = await seedKnowledgeSource(testbed, workspaceId, knowledgeBaseId);
    const documentId = await seedKnowledgeDocument(testbed, workspaceId, knowledgeBaseId, sourceId);
    const oldMarkdown = '# Refunds\n\nRefunds are processed within five days.\n';
    const newMarkdown = '# Refunds\n\nRefunds are processed within seven days.\n';
    const oldOriginalKey = knowledgeOriginalStorageKey(
      workspaceId,
      documentId,
      'old-run',
      'refunds.md',
    );
    const pendingOriginalKey = knowledgeOriginalStorageKey(
      workspaceId,
      documentId,
      'new-run',
      'refunds.txt',
    );
    const oldContentKey = knowledgeContentStorageKey(workspaceId, documentId, 1);
    const syncRunId = testbed.ids.generate();
    await testbed.storage.put(oldOriginalKey, Buffer.from(oldMarkdown), 'text/markdown');
    await testbed.storage.put(pendingOriginalKey, Buffer.from(newMarkdown), 'text/plain');
    await testbed.storage.put(oldContentKey, Buffer.from(oldMarkdown), 'text/markdown');
    await testbed.tenants.run(workspaceId, async () => {
      await documents.update(workspaceId, documentId, {
        title: 'Refunds',
        mimeType: 'text/plain',
        sizeBytes: Buffer.byteLength(newMarkdown),
        originalStorageKey: oldOriginalKey,
        pendingOriginalStorageKey: pendingOriginalKey,
        contentStorageKey: oldContentKey,
        contentHash: 'old-hash',
        status: KnowledgeDocumentStatus.Indexed,
        activeGeneration: 1,
      });
      await syncRuns.insert(newSyncRun(syncRunId, workspaceId, sourceId));
    });

    await ingest.execute(workspaceSystemCtx(workspaceId), { sourceId, syncRunId });

    const document = await testbed.tenants.run(workspaceId, () =>
      documents.findById(workspaceId, documentId),
    );
    const newContentKey = knowledgeContentStorageKey(workspaceId, documentId, 2);
    expect(document).toMatchObject({
      status: KnowledgeDocumentStatus.Indexed,
      activeGeneration: 2,
      originalStorageKey: pendingOriginalKey,
      pendingOriginalStorageKey: null,
      contentStorageKey: newContentKey,
    });
    await expect(testbed.storage.head(oldOriginalKey)).resolves.toBeNull();
    await expect(testbed.storage.head(oldContentKey)).resolves.toBeNull();
    expect(testbed.storage.objects.get(newContentKey)?.body.toString()).toBe(newMarkdown);
  });

  it('marks a document and source as failed on a parse error without retrying the job', async () => {
    const workspaceId = testbed.ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    const sourceId = await seedKnowledgeSource(testbed, workspaceId, knowledgeBaseId);
    const documentId = await seedKnowledgeDocument(testbed, workspaceId, knowledgeBaseId, sourceId);
    const originalKey = knowledgeOriginalStorageKey(
      workspaceId,
      documentId,
      'run-1',
      'refunds.pdf',
    );
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

    await ingest.execute(workspaceSystemCtx(workspaceId), { sourceId, syncRunId });

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
