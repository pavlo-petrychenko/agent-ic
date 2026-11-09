import { KNOWLEDGE_DOCUMENT_TITLE_MAX_LENGTH } from '@agent-ic/contracts';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DOCUMENT_TITLE_TRUNCATED_MESSAGE,
  DocumentParseWarningCode,
} from '@/modules/knowledge/constants/document-parser.constants';
import {
  KnowledgeConnectionStatus,
  KnowledgeDocumentIngestionOutcome,
  KnowledgeDocumentStaleReason,
  KnowledgeDocumentStatus,
  KnowledgeSourceKind,
  KnowledgeSourceStatus,
  KnowledgeSummarySource,
  KnowledgeSyncStatus,
  KnowledgeSyncTrigger,
} from '@/modules/knowledge/constants/knowledge.constants';
import { KNOWLEDGE_EMBEDDING_DIMENSIONS } from '@/modules/knowledge/constants/knowledge.constants';
import { GoogleReconnectRequiredError } from '@/modules/knowledge/errors/google-reconnect-required.error';
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
import { KnowledgeDocumentIngestionService } from '@/modules/knowledge/services/knowledge-document-ingestion.service';
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
  KNOWLEDGE_TEST_LATER,
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
  seedSourceDocument,
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
  let oauth: FakeGoogleOAuthGateway;
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
    oauth = new FakeGoogleOAuthGateway();
    testbed = await createKnowledgeTestbed([
      { token: LlmGateway, value: llm },
      { token: EmbeddingGateway, value: embedding },
      { token: GoogleOAuthGateway, value: oauth },
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
    oauth.clearFailure();
    vi.restoreAllMocks();
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

  it('processes only the documents selected by the sync job', async () => {
    const workspaceId = testbed.ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    const connectionId = await seedKnowledgeConnection(testbed, workspaceId);
    const sourceId = await seedKnowledgeSource(testbed, workspaceId, knowledgeBaseId, {
      kind: KnowledgeSourceKind.GoogleDocs,
      connectionId,
    });
    const ownerSourceId = await seedKnowledgeSource(testbed, workspaceId, knowledgeBaseId, {
      kind: KnowledgeSourceKind.GoogleDocs,
      connectionId,
    });
    await seedKnowledgeDocument(testbed, workspaceId, knowledgeBaseId, sourceId, {
      externalId: 'owned-document',
    });
    const selectedDocumentId = await seedKnowledgeDocument(
      testbed,
      workspaceId,
      knowledgeBaseId,
      ownerSourceId,
      { externalId: 'selected-document' },
    );
    await seedSourceDocument(testbed, workspaceId, knowledgeBaseId, sourceId, selectedDocumentId);
    const ingestionService = testbed.module.get(KnowledgeDocumentIngestionService);
    const ingestSpy = vi
      .spyOn(ingestionService, 'ingest')
      .mockResolvedValue({ outcome: KnowledgeDocumentIngestionOutcome.Skipped });
    const syncRunId = testbed.ids.generate();
    await testbed.tenants.run(workspaceId, () =>
      syncRuns.insert({
        ...newSyncRun(syncRunId, workspaceId, sourceId),
        trigger: KnowledgeSyncTrigger.Manual,
      }),
    );

    await ingest.execute(workspaceSystemCtx(workspaceId), {
      sourceId,
      syncRunId,
      documentIds: [selectedDocumentId],
    });

    const run = await testbed.tenants.run(workspaceId, () =>
      syncRuns.findById(workspaceId, syncRunId),
    );
    expect(ingestSpy).toHaveBeenCalledTimes(1);
    expect(ingestSpy.mock.calls[0]?.[0].document.id).toBe(selectedDocumentId);
    expect(run).toMatchObject({
      documentsTotal: 1,
      documentsSkipped: 1,
    });
  });

  it('marks linked sources as indexing while a shared document is processed', async () => {
    const workspaceId = testbed.ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    const connectionId = await seedKnowledgeConnection(testbed, workspaceId);
    const ownerSourceId = await seedKnowledgeSource(testbed, workspaceId, knowledgeBaseId, {
      kind: KnowledgeSourceKind.GoogleDocs,
      connectionId,
    });
    const linkedSourceId = await seedKnowledgeSource(testbed, workspaceId, knowledgeBaseId, {
      kind: KnowledgeSourceKind.GoogleDocs,
      connectionId,
      status: KnowledgeSourceStatus.Ready,
    });
    const documentId = await seedKnowledgeDocument(
      testbed,
      workspaceId,
      knowledgeBaseId,
      ownerSourceId,
    );
    await seedSourceDocument(testbed, workspaceId, knowledgeBaseId, linkedSourceId, documentId);
    const ingestionService = testbed.module.get(KnowledgeDocumentIngestionService);
    let linkedStatus: KnowledgeSourceStatus | null = null;
    vi.spyOn(ingestionService, 'ingest').mockImplementation(async () => {
      const linkedSource = await testbed.tenants.run(workspaceId, () =>
        sources.findById(workspaceId, linkedSourceId),
      );
      linkedStatus = linkedSource?.status ?? null;
      return { outcome: KnowledgeDocumentIngestionOutcome.Skipped };
    });
    const syncRunId = testbed.ids.generate();
    await testbed.tenants.run(workspaceId, () =>
      syncRuns.insert({
        ...newSyncRun(syncRunId, workspaceId, ownerSourceId),
        trigger: KnowledgeSyncTrigger.Manual,
      }),
    );

    await ingest.execute(workspaceSystemCtx(workspaceId), {
      sourceId: ownerSourceId,
      syncRunId,
      documentIds: [documentId],
    });

    expect(linkedStatus).toBe(KnowledgeSourceStatus.Indexing);
  });

  it('skips unchanged Google Docs and reindexes changed content', async () => {
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
    const file = {
      id: TEST_GOOGLE_DOC_ID,
      name: TEST_GOOGLE_DOC_NAME,
      mimeType: TEST_GOOGLE_DOC_MIME_TYPE,
      webViewLink: TEST_GOOGLE_DOC_URL,
      modifiedTime: TEST_GOOGLE_DOC_MODIFIED_AT,
      version: TEST_GOOGLE_DOC_VERSION,
      trashed: false,
    };
    drive.addFile(file, TEST_GOOGLE_DOC_MARKDOWN);
    await testbed.tenants.run(workspaceId, () =>
      documents.update(workspaceId, documentId, {
        externalId: TEST_GOOGLE_DOC_ID,
        title: TEST_GOOGLE_DOC_NAME,
        mimeType: TEST_GOOGLE_DOC_MIME_TYPE,
      }),
    );

    const initialRunId = testbed.ids.generate();
    await testbed.tenants.run(workspaceId, () =>
      syncRuns.insert(newSyncRun(initialRunId, workspaceId, sourceId)),
    );
    await ingest.execute(workspaceSystemCtx(workspaceId), {
      sourceId,
      syncRunId: initialRunId,
    });

    drive.exportRequests.length = 0;
    const beforeUnchanged = await testbed.tenants.run(workspaceId, () =>
      documents.findById(workspaceId, documentId),
    );
    const unchangedRunId = testbed.ids.generate();
    await testbed.tenants.run(workspaceId, () =>
      syncRuns.insert(newSyncRun(unchangedRunId, workspaceId, sourceId)),
    );
    await ingest.execute(workspaceSystemCtx(workspaceId), {
      sourceId,
      syncRunId: unchangedRunId,
    });

    const unchangedDocument = await testbed.tenants.run(workspaceId, () =>
      documents.findById(workspaceId, documentId),
    );
    const unchangedRun = await testbed.tenants.run(workspaceId, () =>
      syncRuns.findById(workspaceId, unchangedRunId),
    );
    expect(unchangedDocument).toMatchObject({
      status: KnowledgeDocumentStatus.Indexed,
      activeGeneration: 1,
      providerVersion: TEST_GOOGLE_DOC_VERSION,
    });
    expect(unchangedDocument?.updatedAt).toEqual(beforeUnchanged?.updatedAt);
    expect(unchangedRun).toMatchObject({
      status: KnowledgeSyncStatus.Succeeded,
      documentsIndexed: 0,
      documentsSkipped: 1,
    });
    expect(drive.exportRequests).toEqual([]);
    expect(llm.calls).toBe(1);
    expect(embedding.calls).toHaveLength(1);

    const changedMarkdown = '# Policies\n\nRefunds are processed within seven days.';
    drive.addFile(
      {
        ...file,
        version: '43',
        modifiedTime: KNOWLEDGE_TEST_LATER.toISOString(),
      },
      changedMarkdown,
    );
    drive.exportRequests.length = 0;
    const changedRunId = testbed.ids.generate();
    await testbed.tenants.run(workspaceId, () =>
      syncRuns.insert(newSyncRun(changedRunId, workspaceId, sourceId)),
    );
    await ingest.execute(workspaceSystemCtx(workspaceId), {
      sourceId,
      syncRunId: changedRunId,
    });

    const changedDocument = await testbed.tenants.run(workspaceId, () =>
      documents.findById(workspaceId, documentId),
    );
    expect(changedDocument).toMatchObject({
      status: KnowledgeDocumentStatus.Indexed,
      activeGeneration: 2,
      providerVersion: '43',
      providerModifiedAt: KNOWLEDGE_TEST_LATER,
    });
    expect(drive.exportRequests).toEqual([TEST_GOOGLE_DOC_ID]);
    expect(llm.calls).toBe(1);
    expect(embedding.calls).toHaveLength(2);

    drive.addFile(
      {
        ...file,
        version: '44',
        modifiedTime: KNOWLEDGE_TEST_LATER.toISOString(),
      },
      changedMarkdown,
    );
    drive.exportRequests.length = 0;
    const sameContentRunId = testbed.ids.generate();
    await testbed.tenants.run(workspaceId, () =>
      syncRuns.insert(newSyncRun(sameContentRunId, workspaceId, sourceId)),
    );
    await ingest.execute(workspaceSystemCtx(workspaceId), {
      sourceId,
      syncRunId: sameContentRunId,
    });

    const sameContentDocument = await testbed.tenants.run(workspaceId, () =>
      documents.findById(workspaceId, documentId),
    );
    expect(sameContentDocument).toMatchObject({
      status: KnowledgeDocumentStatus.Indexed,
      activeGeneration: 2,
      providerVersion: '44',
      providerModifiedAt: KNOWLEDGE_TEST_LATER,
    });
    expect(drive.exportRequests).toEqual([TEST_GOOGLE_DOC_ID]);
    expect(embedding.calls).toHaveLength(2);
  });

  it('keeps an indexed Google Doc and marks it stale when Drive no longer returns it', async () => {
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
    const file = {
      id: TEST_GOOGLE_DOC_ID,
      name: TEST_GOOGLE_DOC_NAME,
      mimeType: TEST_GOOGLE_DOC_MIME_TYPE,
      webViewLink: TEST_GOOGLE_DOC_URL,
      modifiedTime: TEST_GOOGLE_DOC_MODIFIED_AT,
      version: TEST_GOOGLE_DOC_VERSION,
      trashed: false,
    };
    drive.addFile(file, TEST_GOOGLE_DOC_MARKDOWN);
    await testbed.tenants.run(workspaceId, () =>
      documents.update(workspaceId, documentId, {
        externalId: TEST_GOOGLE_DOC_ID,
        title: TEST_GOOGLE_DOC_NAME,
        mimeType: TEST_GOOGLE_DOC_MIME_TYPE,
      }),
    );

    const initialRunId = testbed.ids.generate();
    await testbed.tenants.run(workspaceId, () =>
      syncRuns.insert(newSyncRun(initialRunId, workspaceId, sourceId)),
    );
    await ingest.execute(workspaceSystemCtx(workspaceId), {
      sourceId,
      syncRunId: initialRunId,
    });

    const indexed = await testbed.tenants.run(workspaceId, () =>
      documents.findById(workspaceId, documentId),
    );
    if (indexed === null || indexed.contentStorageKey === null) {
      throw new Error('the initial sync did not generate content');
    }

    drive.removeFile(TEST_GOOGLE_DOC_ID);
    const staleRunId = testbed.ids.generate();
    await testbed.tenants.run(workspaceId, () =>
      syncRuns.insert(newSyncRun(staleRunId, workspaceId, sourceId)),
    );
    await ingest.execute(workspaceSystemCtx(workspaceId), {
      sourceId,
      syncRunId: staleRunId,
    });

    const staleDocument = await testbed.tenants.run(workspaceId, () =>
      documents.findById(workspaceId, documentId),
    );
    const staleSource = await testbed.tenants.run(workspaceId, () =>
      sources.findById(workspaceId, sourceId),
    );
    const staleRun = await testbed.tenants.run(workspaceId, () =>
      syncRuns.findById(workspaceId, staleRunId),
    );
    expect(staleDocument).toMatchObject({
      status: KnowledgeDocumentStatus.Indexed,
      activeGeneration: indexed.activeGeneration,
      chunkCount: indexed.chunkCount,
      contentStorageKey: indexed.contentStorageKey,
      staleReason: KnowledgeDocumentStaleReason.Missing,
    });
    expect(staleDocument?.staleAt).toBeInstanceOf(Date);
    expect(testbed.storage.objects.get(indexed.contentStorageKey)?.body.toString().trimEnd()).toBe(
      TEST_GOOGLE_DOC_MARKDOWN,
    );
    expect(staleSource).toMatchObject({
      status: KnowledgeSourceStatus.Ready,
      staleDocumentCount: 1,
      documentCount: 1,
      chunkCount: indexed.chunkCount,
    });
    expect(staleRun).toMatchObject({
      status: KnowledgeSyncStatus.Succeeded,
      documentsTotal: 1,
      documentsIndexed: 0,
      documentsSkipped: 0,
      documentsFailed: 0,
      documentsStale: 1,
    });

    drive.addFile(file, TEST_GOOGLE_DOC_MARKDOWN);
    const restoredRunId = testbed.ids.generate();
    await testbed.tenants.run(workspaceId, () =>
      syncRuns.insert(newSyncRun(restoredRunId, workspaceId, sourceId)),
    );
    await ingest.execute(workspaceSystemCtx(workspaceId), {
      sourceId,
      syncRunId: restoredRunId,
    });

    const restoredDocument = await testbed.tenants.run(workspaceId, () =>
      documents.findById(workspaceId, documentId),
    );
    const restoredSource = await testbed.tenants.run(workspaceId, () =>
      sources.findById(workspaceId, sourceId),
    );
    const restoredRun = await testbed.tenants.run(workspaceId, () =>
      syncRuns.findById(workspaceId, restoredRunId),
    );
    expect(restoredDocument).toMatchObject({
      status: KnowledgeDocumentStatus.Indexed,
      staleAt: null,
      staleReason: null,
      activeGeneration: indexed.activeGeneration,
    });
    expect(restoredSource).toMatchObject({
      status: KnowledgeSourceStatus.Ready,
      staleDocumentCount: 0,
    });
    expect(restoredRun).toMatchObject({
      status: KnowledgeSyncStatus.Succeeded,
      documentsSkipped: 1,
      documentsStale: 0,
    });
  });

  it('fails a Google Doc with no local copy when Drive no longer returns it', async () => {
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
    const documentId = await seedKnowledgeDocument(
      testbed,
      workspaceId,
      knowledgeBaseId,
      sourceId,
      {
        externalId: TEST_GOOGLE_DOC_ID,
        title: TEST_GOOGLE_DOC_NAME,
        mimeType: TEST_GOOGLE_DOC_MIME_TYPE,
      },
    );
    drive.removeFile(TEST_GOOGLE_DOC_ID);
    const syncRunId = testbed.ids.generate();
    await testbed.tenants.run(workspaceId, () =>
      syncRuns.insert(newSyncRun(syncRunId, workspaceId, sourceId)),
    );

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
      staleAt: null,
      staleReason: null,
      errorCode: 'DOCUMENT_UNREADABLE',
    });
    expect(source).toMatchObject({
      status: KnowledgeSourceStatus.Error,
      staleDocumentCount: 0,
    });
    expect(syncRun).toMatchObject({
      status: KnowledgeSyncStatus.Failed,
      documentsFailed: 1,
      documentsStale: 0,
    });
  });

  it('revokes the connection and fails the source when Google requires a reconnect', async () => {
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
    const syncRunId = testbed.ids.generate();
    await testbed.tenants.run(workspaceId, async () => {
      await documents.update(workspaceId, documentId, {
        externalId: TEST_GOOGLE_DOC_ID,
        title: TEST_GOOGLE_DOC_NAME,
        mimeType: TEST_GOOGLE_DOC_MIME_TYPE,
      });
      await syncRuns.insert(newSyncRun(syncRunId, workspaceId, sourceId));
    });
    oauth.failWith(new GoogleReconnectRequiredError());

    await expect(
      ingest.execute(workspaceSystemCtx(workspaceId), { sourceId, syncRunId }),
    ).rejects.toBeInstanceOf(GoogleReconnectRequiredError);

    const connection = await testbed.tenants.run(workspaceId, () =>
      connections.findById(workspaceId, connectionId),
    );
    const source = await testbed.tenants.run(workspaceId, () =>
      sources.findById(workspaceId, sourceId),
    );
    const document = await testbed.tenants.run(workspaceId, () =>
      documents.findById(workspaceId, documentId),
    );
    const syncRun = await testbed.tenants.run(workspaceId, () =>
      syncRuns.findById(workspaceId, syncRunId),
    );

    expect(connection).toMatchObject({
      status: KnowledgeConnectionStatus.Revoked,
      lastErrorCode: 'GOOGLE_RECONNECT_REQUIRED',
    });
    expect(source).toMatchObject({
      status: KnowledgeSourceStatus.Error,
      lastErrorCode: 'GOOGLE_RECONNECT_REQUIRED',
    });
    expect(document).toMatchObject({
      status: KnowledgeDocumentStatus.Error,
      errorCode: 'GOOGLE_RECONNECT_REQUIRED',
    });
    expect(syncRun).toMatchObject({
      status: KnowledgeSyncStatus.Failed,
      documentsFailed: 1,
      errorCode: 'GOOGLE_RECONNECT_REQUIRED',
    });
  });

  it('fails every unprocessed document when a multi-document sync aborts and can retry them', async () => {
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
    const files = [
      {
        id: 'google-doc-1',
        name: 'Refund policy',
        markdown: '# Refund policy\n\nRefunds are processed within five days.\n',
      },
      {
        id: 'google-doc-2',
        name: 'Pricing',
        markdown: '# Pricing\n\nOur prices are listed in the catalogue.\n',
      },
      {
        id: 'google-doc-3',
        name: 'Delivery',
        markdown: '# Delivery\n\nOrders arrive within three working days.\n',
      },
    ];
    const documentIds: string[] = [];
    for (const file of files) {
      const documentId = await seedKnowledgeDocument(
        testbed,
        workspaceId,
        knowledgeBaseId,
        sourceId,
      );
      await testbed.tenants.run(workspaceId, () =>
        documents.update(workspaceId, documentId, {
          externalId: file.id,
          title: file.name,
          mimeType: TEST_GOOGLE_DOC_MIME_TYPE,
        }),
      );
      drive.addFile(
        {
          id: file.id,
          name: file.name,
          mimeType: TEST_GOOGLE_DOC_MIME_TYPE,
          webViewLink: TEST_GOOGLE_DOC_URL,
          modifiedTime: TEST_GOOGLE_DOC_MODIFIED_AT,
          version: TEST_GOOGLE_DOC_VERSION,
          trashed: false,
        },
        file.markdown,
      );
      documentIds.push(documentId);
    }
    const syncRunId = testbed.ids.generate();
    await testbed.tenants.run(workspaceId, () =>
      syncRuns.insert(newSyncRun(syncRunId, workspaceId, sourceId)),
    );
    oauth.failWith(new GoogleReconnectRequiredError());

    await expect(
      ingest.execute(workspaceSystemCtx(workspaceId), { sourceId, syncRunId }),
    ).rejects.toBeInstanceOf(GoogleReconnectRequiredError);

    const failedDocuments = await testbed.tenants.run(workspaceId, async () => {
      const stored = [];
      for (const documentId of documentIds) {
        stored.push(await documents.findById(workspaceId, documentId));
      }
      return stored;
    });
    const failedSource = await testbed.tenants.run(workspaceId, () =>
      sources.findById(workspaceId, sourceId),
    );
    const failedRun = await testbed.tenants.run(workspaceId, () =>
      syncRuns.findById(workspaceId, syncRunId),
    );

    expect(failedDocuments).toEqual(
      documentIds.map(() =>
        expect.objectContaining({
          status: KnowledgeDocumentStatus.Error,
          errorCode: 'GOOGLE_RECONNECT_REQUIRED',
        }),
      ),
    );
    expect(failedSource).toMatchObject({
      status: KnowledgeSourceStatus.Error,
      lastErrorCode: 'GOOGLE_RECONNECT_REQUIRED',
    });
    expect(failedRun).toMatchObject({
      status: KnowledgeSyncStatus.Failed,
      documentsTotal: 3,
      documentsFailed: 3,
    });

    oauth.clearFailure();
    await testbed.tenants.run(workspaceId, () =>
      connections.update(workspaceId, connectionId, {
        status: KnowledgeConnectionStatus.Active,
        lastErrorCode: null,
        lastErrorMessage: null,
      }),
    );
    const retryRunId = testbed.ids.generate();
    await testbed.tenants.run(workspaceId, () =>
      syncRuns.insert(newSyncRun(retryRunId, workspaceId, sourceId)),
    );

    await ingest.execute(workspaceSystemCtx(workspaceId), { sourceId, syncRunId: retryRunId });

    const retriedDocuments = await testbed.tenants.run(workspaceId, async () => {
      const stored = [];
      for (const documentId of documentIds) {
        stored.push(await documents.findById(workspaceId, documentId));
      }
      return stored;
    });
    const retriedSource = await testbed.tenants.run(workspaceId, () =>
      sources.findById(workspaceId, sourceId),
    );
    const retriedRun = await testbed.tenants.run(workspaceId, () =>
      syncRuns.findById(workspaceId, retryRunId),
    );

    expect(retriedDocuments).toEqual(
      documentIds.map(() => expect.objectContaining({ status: KnowledgeDocumentStatus.Indexed })),
    );
    expect(retriedSource?.status).toBe(KnowledgeSourceStatus.Ready);
    expect(retriedRun).toMatchObject({
      status: KnowledgeSyncStatus.Succeeded,
      documentsTotal: 3,
      documentsIndexed: 3,
      documentsFailed: 0,
    });
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
