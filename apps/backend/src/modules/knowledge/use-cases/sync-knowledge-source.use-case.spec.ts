import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  KnowledgeConnectionStatus,
  KnowledgeDocumentStatus,
  KnowledgeSourceKind,
  KnowledgeSourceStatus,
  KnowledgeSyncInterval,
  KnowledgeSyncStatus,
  KnowledgeSyncTrigger,
} from '@/modules/knowledge/constants/knowledge.constants';
import { GoogleReconnectRequiredError } from '@/modules/knowledge/errors/google-reconnect-required.error';
import { KnowledgeSourceBusyError } from '@/modules/knowledge/errors/knowledge-source-busy.error';
import { KnowledgeSourceNotFoundError } from '@/modules/knowledge/errors/knowledge-source-not-found.error';
import { KnowledgeSourceNotSyncableError } from '@/modules/knowledge/errors/knowledge-source-not-syncable.error';
import { DocumentsRepository } from '@/modules/knowledge/repositories/documents.repository';
import { SourcesRepository } from '@/modules/knowledge/repositories/sources.repository';
import { SyncRunsRepository } from '@/modules/knowledge/repositories/sync-runs.repository';
import { SyncKnowledgeSourceUseCase } from '@/modules/knowledge/use-cases/sync-knowledge-source.use-case';
import { JobsService } from '@/platform/queues/services/jobs.service';
import {
  KNOWLEDGE_TEST_LATER,
  KNOWLEDGE_TEST_START,
} from '@test/support/constants/knowledge-testing.constants';
import { newSyncRun } from '@test/support/fixtures/knowledge.fixture';
import {
  createKnowledgeTestbed,
  knowledgeCtx,
  publicKnowledgeSourceId,
  seedKnowledgeBase,
  seedKnowledgeConnection,
  seedKnowledgeDocument,
  seedKnowledgeSource,
  seedSourceDocument,
} from '@test/support/helpers/knowledge-testing.helpers';
import type { KnowledgeTestbed } from '@test/support/typedefs/knowledge-testing.typedefs';

class FakeJobsService {
  readonly enqueued: Array<{ readonly name: string; readonly data: unknown }> = [];

  async enqueue(
    _ctx: unknown,
    definition: { readonly name: string },
    data: unknown,
  ): Promise<void> {
    this.enqueued.push({ name: definition.name, data });
  }
}

describe('SyncKnowledgeSourceUseCase', () => {
  let testbed: KnowledgeTestbed;
  let syncKnowledgeSource: SyncKnowledgeSourceUseCase;
  let sources: SourcesRepository;
  let documents: DocumentsRepository;
  let syncRuns: SyncRunsRepository;
  let jobs: FakeJobsService;

  beforeAll(async () => {
    jobs = new FakeJobsService();
    testbed = await createKnowledgeTestbed([{ token: JobsService, value: jobs }]);
    syncKnowledgeSource = testbed.module.get(SyncKnowledgeSourceUseCase);
    sources = testbed.module.get(SourcesRepository);
    documents = testbed.module.get(DocumentsRepository);
    syncRuns = testbed.module.get(SyncRunsRepository);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('queues a manual sync for a ready Google source without resetting its documents', async () => {
    const workspaceId = testbed.ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    const connectionId = await seedKnowledgeConnection(testbed, workspaceId);
    const sourceId = await seedKnowledgeSource(testbed, workspaceId, knowledgeBaseId, {
      kind: KnowledgeSourceKind.GoogleDocs,
      connectionId,
      status: KnowledgeSourceStatus.Ready,
      syncInterval: KnowledgeSyncInterval.Daily,
      syncTime: '09:00',
      timezone: 'Europe/Kyiv',
      nextSyncAt: KNOWLEDGE_TEST_LATER,
      lastSyncAt: KNOWLEDGE_TEST_START,
    });
    const documentId = await seedKnowledgeDocument(testbed, workspaceId, knowledgeBaseId, sourceId);
    await testbed.tenants.run(workspaceId, () =>
      documents.update(workspaceId, documentId, {
        status: KnowledgeDocumentStatus.Indexed,
      }),
    );

    const result = await syncKnowledgeSource.execute(knowledgeCtx(workspaceId), {
      id: publicKnowledgeSourceId(testbed, sourceId),
    });
    const source = await testbed.tenants.run(workspaceId, () =>
      sources.findById(workspaceId, sourceId),
    );
    const document = await testbed.tenants.run(workspaceId, () =>
      documents.findById(workspaceId, documentId),
    );
    const run = await testbed.tenants.run(workspaceId, () =>
      syncRuns.findLatestBySource(workspaceId, sourceId),
    );

    expect(result).toEqual({ id: publicKnowledgeSourceId(testbed, sourceId) });
    expect(source).toMatchObject({
      status: KnowledgeSourceStatus.Pending,
      nextSyncAt: KNOWLEDGE_TEST_LATER,
      lastSyncAt: KNOWLEDGE_TEST_START,
      lastErrorCode: null,
      lastErrorMessage: null,
    });
    expect(document?.status).toBe(KnowledgeDocumentStatus.Indexed);
    expect(run).toMatchObject({
      status: KnowledgeSyncStatus.Queued,
      trigger: KnowledgeSyncTrigger.Manual,
      documentsTotal: 1,
    });
    expect(jobs.enqueued).toHaveLength(1);
    expect(jobs.enqueued[0]).toMatchObject({
      name: 'ingest-knowledge-source',
      data: { sourceId, syncRunId: run?.id },
    });
  });

  it('queues a manual sync for a source that only references documents', async () => {
    const workspaceId = testbed.ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    const connectionId = await seedKnowledgeConnection(testbed, workspaceId);
    const ownerSourceId = await seedKnowledgeSource(testbed, workspaceId, knowledgeBaseId, {
      kind: KnowledgeSourceKind.GoogleDocs,
      connectionId,
      status: KnowledgeSourceStatus.Ready,
    });
    const sourceId = await seedKnowledgeSource(testbed, workspaceId, knowledgeBaseId, {
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
    await seedSourceDocument(testbed, workspaceId, knowledgeBaseId, sourceId, documentId);

    const result = await syncKnowledgeSource.execute(knowledgeCtx(workspaceId), {
      id: publicKnowledgeSourceId(testbed, sourceId),
    });
    const source = await testbed.tenants.run(workspaceId, () =>
      sources.findById(workspaceId, sourceId),
    );
    const run = await testbed.tenants.run(workspaceId, () =>
      syncRuns.findLatestBySource(workspaceId, sourceId),
    );

    expect(result).toEqual({ id: publicKnowledgeSourceId(testbed, sourceId) });
    expect(source?.status).toBe(KnowledgeSourceStatus.Pending);
    expect(run).toMatchObject({
      status: KnowledgeSyncStatus.Queued,
      trigger: KnowledgeSyncTrigger.Manual,
      documentsTotal: 1,
    });
    expect(jobs.enqueued.at(-1)).toMatchObject({
      name: 'ingest-knowledge-source',
      data: { sourceId, syncRunId: run?.id },
    });
  });

  it('queues every document linked to a mixed source', async () => {
    const workspaceId = testbed.ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    const connectionId = await seedKnowledgeConnection(testbed, workspaceId);
    const sourceId = await seedKnowledgeSource(testbed, workspaceId, knowledgeBaseId, {
      kind: KnowledgeSourceKind.GoogleDocs,
      connectionId,
      status: KnowledgeSourceStatus.Ready,
    });
    const ownerSourceId = await seedKnowledgeSource(testbed, workspaceId, knowledgeBaseId, {
      kind: KnowledgeSourceKind.GoogleDocs,
      connectionId,
      status: KnowledgeSourceStatus.Ready,
    });
    const ownedDocumentId = await seedKnowledgeDocument(
      testbed,
      workspaceId,
      knowledgeBaseId,
      sourceId,
      { externalId: 'owned-document' },
    );
    const referencedDocumentId = await seedKnowledgeDocument(
      testbed,
      workspaceId,
      knowledgeBaseId,
      ownerSourceId,
      { externalId: 'referenced-document' },
    );
    await seedSourceDocument(testbed, workspaceId, knowledgeBaseId, sourceId, referencedDocumentId);

    await syncKnowledgeSource.execute(knowledgeCtx(workspaceId), {
      id: publicKnowledgeSourceId(testbed, sourceId),
    });

    const run = await testbed.tenants.run(workspaceId, () =>
      syncRuns.findLatestBySource(workspaceId, sourceId),
    );

    expect(run).toMatchObject({
      status: KnowledgeSyncStatus.Queued,
      trigger: KnowledgeSyncTrigger.Manual,
      documentsTotal: 2,
    });
    expect(jobs.enqueued.at(-1)).toMatchObject({
      data: {
        sourceId,
        syncRunId: run?.id,
        documentIds: expect.arrayContaining([ownedDocumentId, referencedDocumentId]),
      },
    });
    const lastJob = jobs.enqueued.at(-1);
    if (lastJob === undefined) {
      throw new Error('the sync job was not enqueued');
    }
    const jobData = lastJob.data as { readonly documentIds: readonly string[] };
    expect(jobData.documentIds).toHaveLength(2);
  });

  it('refuses an upload source', async () => {
    const workspaceId = testbed.ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    const sourceId = await seedKnowledgeSource(testbed, workspaceId, knowledgeBaseId, {
      status: KnowledgeSourceStatus.Ready,
    });
    await seedKnowledgeDocument(testbed, workspaceId, knowledgeBaseId, sourceId);

    await expect(
      syncKnowledgeSource.execute(knowledgeCtx(workspaceId), {
        id: publicKnowledgeSourceId(testbed, sourceId),
      }),
    ).rejects.toBeInstanceOf(KnowledgeSourceNotSyncableError);
  });

  it('refuses a Google source that is not ready', async () => {
    const workspaceId = testbed.ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    const connectionId = await seedKnowledgeConnection(testbed, workspaceId);
    const sourceId = await seedKnowledgeSource(testbed, workspaceId, knowledgeBaseId, {
      kind: KnowledgeSourceKind.GoogleDocs,
      connectionId,
      status: KnowledgeSourceStatus.Error,
    });
    await seedKnowledgeDocument(testbed, workspaceId, knowledgeBaseId, sourceId);

    await expect(
      syncKnowledgeSource.execute(knowledgeCtx(workspaceId), {
        id: publicKnowledgeSourceId(testbed, sourceId),
      }),
    ).rejects.toBeInstanceOf(KnowledgeSourceNotSyncableError);
  });

  it('refuses a source with an active sync run', async () => {
    const workspaceId = testbed.ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    const connectionId = await seedKnowledgeConnection(testbed, workspaceId);
    const sourceId = await seedKnowledgeSource(testbed, workspaceId, knowledgeBaseId, {
      kind: KnowledgeSourceKind.GoogleDocs,
      connectionId,
      status: KnowledgeSourceStatus.Ready,
    });
    await seedKnowledgeDocument(testbed, workspaceId, knowledgeBaseId, sourceId);
    await testbed.tenants.run(workspaceId, () =>
      syncRuns.insert(newSyncRun(testbed.ids.generate(), workspaceId, sourceId)),
    );

    await expect(
      syncKnowledgeSource.execute(knowledgeCtx(workspaceId), {
        id: publicKnowledgeSourceId(testbed, sourceId),
      }),
    ).rejects.toBeInstanceOf(KnowledgeSourceBusyError);
  });

  it('refuses a source whose Google connection was revoked', async () => {
    const workspaceId = testbed.ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    const connectionId = await seedKnowledgeConnection(testbed, workspaceId, {
      status: KnowledgeConnectionStatus.Revoked,
    });
    const sourceId = await seedKnowledgeSource(testbed, workspaceId, knowledgeBaseId, {
      kind: KnowledgeSourceKind.GoogleDocs,
      connectionId,
      status: KnowledgeSourceStatus.Ready,
    });
    await seedKnowledgeDocument(testbed, workspaceId, knowledgeBaseId, sourceId);

    await expect(
      syncKnowledgeSource.execute(knowledgeCtx(workspaceId), {
        id: publicKnowledgeSourceId(testbed, sourceId),
      }),
    ).rejects.toBeInstanceOf(GoogleReconnectRequiredError);
  });

  it('refuses a source that owns no documents', async () => {
    const workspaceId = testbed.ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    const connectionId = await seedKnowledgeConnection(testbed, workspaceId);
    const sourceId = await seedKnowledgeSource(testbed, workspaceId, knowledgeBaseId, {
      kind: KnowledgeSourceKind.GoogleDocs,
      connectionId,
      status: KnowledgeSourceStatus.Ready,
    });

    await expect(
      syncKnowledgeSource.execute(knowledgeCtx(workspaceId), {
        id: publicKnowledgeSourceId(testbed, sourceId),
      }),
    ).rejects.toBeInstanceOf(KnowledgeSourceNotSyncableError);
  });

  it('refuses an unknown source', async () => {
    const workspaceId = testbed.ids.generate();
    await seedKnowledgeBase(testbed, workspaceId);

    await expect(
      syncKnowledgeSource.execute(knowledgeCtx(workspaceId), {
        id: publicKnowledgeSourceId(testbed, testbed.ids.generate()),
      }),
    ).rejects.toBeInstanceOf(KnowledgeSourceNotFoundError);
  });
});
