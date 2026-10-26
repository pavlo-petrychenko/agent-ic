import { IdPrefix } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { knowledgeUploadTicketEntry } from '@/modules/knowledge/constants/knowledge-upload-cache.constants';
import {
  KnowledgeDocumentStatus,
  KnowledgeSourceKind,
  KnowledgeSourceStatus,
  KnowledgeSyncStatus,
} from '@/modules/knowledge/constants/knowledge.constants';
import { KnowledgeUploadInvalidError } from '@/modules/knowledge/errors/knowledge-upload-invalid.error';
import {
  knowledgeOriginalStorageKey,
  knowledgeUploadStorageKey,
} from '@/modules/knowledge/helpers/knowledge-storage.helpers';
import { DocumentsRepository } from '@/modules/knowledge/repositories/documents.repository';
import { SourcesRepository } from '@/modules/knowledge/repositories/sources.repository';
import { SyncRunsRepository } from '@/modules/knowledge/repositories/sync-runs.repository';
import { ConfirmUploadUseCase } from '@/modules/knowledge/use-cases/confirm-upload.use-case';
import { CreateUploadUseCase } from '@/modules/knowledge/use-cases/create-upload.use-case';
import { CacheService } from '@/platform/cache/services/cache.service';
import { QueueName } from '@/platform/queues/constants/queue.constants';
import { QueuesService } from '@/platform/queues/services/queues.service';
import {
  createKnowledgeTestbed,
  knowledgeCtx,
  publicKnowledgeBaseId,
  publicKnowledgeSourceId,
  seedKnowledgeBase,
} from '@test/support/helpers/knowledge-testing.helpers';
import type { KnowledgeTestbed } from '@test/support/typedefs/knowledge-testing.typedefs';

const MARKDOWN = '# Refunds\n\nRefunds are processed within five days.\n';

describe('knowledge upload use cases', () => {
  let testbed: KnowledgeTestbed;
  let createUpload: CreateUploadUseCase;
  let confirmUpload: ConfirmUploadUseCase;
  let documents: DocumentsRepository;
  let sources: SourcesRepository;
  let syncRuns: SyncRunsRepository;
  let cache: CacheService;
  let queues: QueuesService;

  beforeAll(async () => {
    testbed = await createKnowledgeTestbed();
    createUpload = testbed.module.get(CreateUploadUseCase);
    confirmUpload = testbed.module.get(ConfirmUploadUseCase);
    documents = testbed.module.get(DocumentsRepository);
    sources = testbed.module.get(SourcesRepository);
    syncRuns = testbed.module.get(SyncRunsRepository);
    cache = testbed.module.get(CacheService);
    queues = testbed.module.get(QueuesService);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('creates, confirms and enqueues one upload', async () => {
    const workspaceId = testbed.ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    const ctx = knowledgeCtx(workspaceId);
    const created = await createUpload.execute(ctx, {
      knowledgeBaseId: publicKnowledgeBaseId(testbed, knowledgeBaseId),
      fileName: 'C:\\fakepath\\Refunds.MD',
      mimeType: 'text/markdown',
      sizeBytes: Buffer.byteLength(MARKDOWN),
    });
    const documentId = testbed.ids.fromPublic(IdPrefix.KnowledgeDocument, created.documentId);
    const uploadKey = knowledgeUploadStorageKey(workspaceId, documentId, 'Refunds.MD');
    const originalKey = knowledgeOriginalStorageKey(workspaceId, documentId, 'Refunds.MD');
    await testbed.storage.put(uploadKey, Buffer.from(MARKDOWN), 'text/markdown');

    expect(created.uploadUrl).toContain(uploadKey);
    expect(testbed.storage.presignedPuts[0]).toEqual({
      key: uploadKey,
      contentType: 'text/markdown',
      expiresInSeconds: 900,
    });
    await expect(
      cache.get(knowledgeUploadTicketEntry(workspaceId, documentId)),
    ).resolves.not.toBeNull();

    const confirmed = await confirmUpload.execute(ctx, created);

    expect(confirmed).toMatchObject({
      kind: KnowledgeSourceKind.Upload,
      title: 'Refunds',
      status: KnowledgeSourceStatus.Pending,
      documentCount: 0,
      chunkCount: 0,
    });
    const sourceId = testbed.ids.fromPublic(IdPrefix.KnowledgeSource, confirmed.id);
    const document = await testbed.tenants.run(workspaceId, () =>
      documents.findById(workspaceId, documentId),
    );
    const source = await testbed.tenants.run(workspaceId, () =>
      sources.findById(workspaceId, sourceId),
    );
    const syncRun = await testbed.tenants.run(workspaceId, () =>
      syncRuns.findLatestBySource(workspaceId, sourceId),
    );
    const jobs = await queues.get(QueueName.Ingest).getJobs(['waiting', 'delayed', 'active']);

    expect(document).toMatchObject({
      sourceId,
      status: KnowledgeDocumentStatus.Pending,
      originalStorageKey: originalKey,
      activeGeneration: 0,
      contentStorageKey: null,
      summary: null,
    });
    expect(source).toMatchObject({ status: KnowledgeSourceStatus.Pending });
    expect(syncRun).toMatchObject({
      status: KnowledgeSyncStatus.Queued,
      documentsTotal: 1,
      documentsIndexed: 0,
    });
    expect(jobs).toHaveLength(1);
    await expect(testbed.storage.head(uploadKey)).resolves.toBeNull();
    await expect(testbed.storage.head(originalKey)).resolves.toMatchObject({
      size: Buffer.byteLength(MARKDOWN),
      contentType: 'text/markdown',
    });
    await expect(
      cache.get(knowledgeUploadTicketEntry(workspaceId, documentId)),
    ).resolves.toBeNull();

    const repeated = await confirmUpload.execute(ctx, created);
    expect(repeated.id).toBe(confirmed.id);
    expect(
      await queues.get(QueueName.Ingest).getJobs(['waiting', 'delayed', 'active']),
    ).toHaveLength(1);
  });

  it('rejects an object whose actual content type does not match the ticket', async () => {
    const workspaceId = testbed.ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    const ctx = knowledgeCtx(workspaceId);
    const created = await createUpload.execute(ctx, {
      knowledgeBaseId: publicKnowledgeBaseId(testbed, knowledgeBaseId),
      fileName: 'refunds.md',
      mimeType: 'text/markdown',
      sizeBytes: Buffer.byteLength(MARKDOWN),
    });
    const documentId = testbed.ids.fromPublic(IdPrefix.KnowledgeDocument, created.documentId);
    const uploadKey = knowledgeUploadStorageKey(workspaceId, documentId, 'refunds.md');
    await testbed.storage.put(uploadKey, Buffer.from(MARKDOWN), 'text/plain');

    await expect(confirmUpload.execute(ctx, created)).rejects.toBeInstanceOf(
      KnowledgeUploadInvalidError,
    );
    await expect(testbed.storage.head(uploadKey)).resolves.toBeNull();
    await expect(
      cache.get(knowledgeUploadTicketEntry(workspaceId, documentId)),
    ).resolves.toBeNull();
    expect(
      await testbed.tenants.run(workspaceId, () => documents.findById(workspaceId, documentId)),
    ).toBeNull();
  });

  it('replaces the file of an existing upload without changing the document id', async () => {
    const workspaceId = testbed.ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    const ctx = knowledgeCtx(workspaceId);
    const created = await createUpload.execute(ctx, {
      knowledgeBaseId: publicKnowledgeBaseId(testbed, knowledgeBaseId),
      fileName: 'refunds.md',
      mimeType: 'text/markdown',
      sizeBytes: Buffer.byteLength(MARKDOWN),
    });
    const documentId = testbed.ids.fromPublic(IdPrefix.KnowledgeDocument, created.documentId);
    const uploadKey = knowledgeUploadStorageKey(workspaceId, documentId, 'refunds.md');
    await testbed.storage.put(uploadKey, Buffer.from(MARKDOWN), 'text/markdown');
    const confirmed = await confirmUpload.execute(ctx, created);
    const sourceId = testbed.ids.fromPublic(IdPrefix.KnowledgeSource, confirmed.id);
    await testbed.tenants.run(workspaceId, async () => {
      await documents.update(workspaceId, documentId, {
        status: KnowledgeDocumentStatus.Indexed,
        activeGeneration: 1,
        contentHash: 'old-hash',
        chunkCount: 2,
      });
      await sources.update(workspaceId, sourceId, { status: KnowledgeSourceStatus.Ready });
    });
    testbed.clock.advanceBy(1_000);
    const newMarkdown = '# Refunds\n\nRefunds are processed within seven days.\n';
    const replacement = await createUpload.execute(ctx, {
      knowledgeBaseId: publicKnowledgeBaseId(testbed, knowledgeBaseId),
      sourceId: publicKnowledgeSourceId(testbed, sourceId),
      fileName: 'Refunds-v2.md',
      mimeType: 'text/markdown',
      sizeBytes: Buffer.byteLength(newMarkdown),
    });
    const replacementDocumentId = testbed.ids.fromPublic(
      IdPrefix.KnowledgeDocument,
      replacement.documentId,
    );
    const replacementUploadKey = knowledgeUploadStorageKey(
      workspaceId,
      replacementDocumentId,
      'Refunds-v2.md',
    );
    const replacementOriginalKey = knowledgeOriginalStorageKey(
      workspaceId,
      replacementDocumentId,
      'Refunds-v2.md',
    );
    await testbed.storage.put(replacementUploadKey, Buffer.from(newMarkdown), 'text/markdown');

    const replaced = await confirmUpload.execute(ctx, replacement);

    const document = await testbed.tenants.run(workspaceId, () =>
      documents.findById(workspaceId, documentId),
    );
    const syncRun = await testbed.tenants.run(workspaceId, () =>
      syncRuns.findLatestBySource(workspaceId, sourceId),
    );
    expect(replacementDocumentId).toBe(documentId);
    expect(replaced.id).toBe(confirmed.id);
    expect(document).toMatchObject({
      status: KnowledgeDocumentStatus.Pending,
      activeGeneration: 1,
      contentHash: 'old-hash',
      chunkCount: 2,
      originalStorageKey: replacementOriginalKey,
    });
    expect(syncRun).toMatchObject({ status: KnowledgeSyncStatus.Queued });
    expect(syncRun?.trigger).toBe('manual');
  });
});
