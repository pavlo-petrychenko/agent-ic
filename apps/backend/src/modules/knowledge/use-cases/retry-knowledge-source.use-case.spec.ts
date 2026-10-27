import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  KnowledgeDocumentStatus,
  KnowledgeSourceStatus,
  KnowledgeSyncStatus,
  KnowledgeSyncTrigger,
} from '@/modules/knowledge/constants/knowledge.constants';
import { KnowledgeSourceBusyError } from '@/modules/knowledge/errors/knowledge-source-busy.error';
import { KnowledgeSourceNotFoundError } from '@/modules/knowledge/errors/knowledge-source-not-found.error';
import { KnowledgeSourceNotRetryableError } from '@/modules/knowledge/errors/knowledge-source-not-retryable.error';
import { DocumentsRepository } from '@/modules/knowledge/repositories/documents.repository';
import { SourcesRepository } from '@/modules/knowledge/repositories/sources.repository';
import { SyncRunsRepository } from '@/modules/knowledge/repositories/sync-runs.repository';
import { RetryKnowledgeSourceUseCase } from '@/modules/knowledge/use-cases/retry-knowledge-source.use-case';
import { JobsService } from '@/platform/queues/services/jobs.service';
import { newSyncRun } from '@test/support/fixtures/knowledge.fixture';
import {
  createKnowledgeTestbed,
  knowledgeCtx,
  publicKnowledgeSourceId,
  seedKnowledgeBase,
  seedKnowledgeDocument,
  seedKnowledgeSource,
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

describe('RetryKnowledgeSourceUseCase', () => {
  let testbed: KnowledgeTestbed;
  let retryKnowledgeSource: RetryKnowledgeSourceUseCase;
  let sources: SourcesRepository;
  let documents: DocumentsRepository;
  let syncRuns: SyncRunsRepository;
  let jobs: FakeJobsService;

  beforeAll(async () => {
    jobs = new FakeJobsService();
    testbed = await createKnowledgeTestbed([{ token: JobsService, value: jobs }]);
    retryKnowledgeSource = testbed.module.get(RetryKnowledgeSourceUseCase);
    sources = testbed.module.get(SourcesRepository);
    documents = testbed.module.get(DocumentsRepository);
    syncRuns = testbed.module.get(SyncRunsRepository);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('queues a failed source and resets its documents', async () => {
    const workspaceId = testbed.ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    const sourceId = await seedKnowledgeSource(testbed, workspaceId, knowledgeBaseId);
    const documentId = await seedKnowledgeDocument(testbed, workspaceId, knowledgeBaseId, sourceId);
    await testbed.tenants.run(workspaceId, async () => {
      await sources.update(workspaceId, sourceId, {
        status: KnowledgeSourceStatus.Error,
        lastErrorCode: 'UPSTREAM_FAILED',
        lastErrorMessage: 'An external service failed.',
      });
      await documents.update(workspaceId, documentId, {
        status: KnowledgeDocumentStatus.Error,
        errorCode: 'UPSTREAM_FAILED',
        errorMessage: 'An external service failed.',
      });
    });

    const result = await retryKnowledgeSource.execute(knowledgeCtx(workspaceId), {
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
      lastErrorCode: null,
      lastErrorMessage: null,
    });
    expect(document).toMatchObject({
      status: KnowledgeDocumentStatus.Pending,
      errorCode: null,
      errorMessage: null,
    });
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

  it('refuses a source that is still active', async () => {
    const workspaceId = testbed.ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    const sourceId = await seedKnowledgeSource(testbed, workspaceId, knowledgeBaseId);
    await seedKnowledgeDocument(testbed, workspaceId, knowledgeBaseId, sourceId);

    await expect(
      retryKnowledgeSource.execute(knowledgeCtx(workspaceId), {
        id: publicKnowledgeSourceId(testbed, sourceId),
      }),
    ).rejects.toBeInstanceOf(KnowledgeSourceBusyError);
  });

  it('refuses a source that is not failed', async () => {
    const workspaceId = testbed.ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    const sourceId = await seedKnowledgeSource(testbed, workspaceId, knowledgeBaseId);
    await seedKnowledgeDocument(testbed, workspaceId, knowledgeBaseId, sourceId);
    await testbed.tenants.run(workspaceId, () =>
      sources.update(workspaceId, sourceId, { status: KnowledgeSourceStatus.Ready }),
    );

    await expect(
      retryKnowledgeSource.execute(knowledgeCtx(workspaceId), {
        id: publicKnowledgeSourceId(testbed, sourceId),
      }),
    ).rejects.toBeInstanceOf(KnowledgeSourceNotRetryableError);
  });

  it('refuses a failed source without documents', async () => {
    const workspaceId = testbed.ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    const sourceId = await seedKnowledgeSource(testbed, workspaceId, knowledgeBaseId);
    await testbed.tenants.run(workspaceId, () =>
      sources.update(workspaceId, sourceId, {
        status: KnowledgeSourceStatus.Error,
        lastErrorCode: 'UPSTREAM_FAILED',
      }),
    );

    await expect(
      retryKnowledgeSource.execute(knowledgeCtx(workspaceId), {
        id: publicKnowledgeSourceId(testbed, sourceId),
      }),
    ).rejects.toBeInstanceOf(KnowledgeSourceNotRetryableError);
  });

  it('refuses an unknown source', async () => {
    const workspaceId = testbed.ids.generate();
    await seedKnowledgeBase(testbed, workspaceId);

    await expect(
      retryKnowledgeSource.execute(knowledgeCtx(workspaceId), {
        id: publicKnowledgeSourceId(testbed, testbed.ids.generate()),
      }),
    ).rejects.toBeInstanceOf(KnowledgeSourceNotFoundError);
  });

  it('refuses a source with an active sync run even when its status is stale', async () => {
    const workspaceId = testbed.ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    const sourceId = await seedKnowledgeSource(testbed, workspaceId, knowledgeBaseId);
    await seedKnowledgeDocument(testbed, workspaceId, knowledgeBaseId, sourceId);
    await testbed.tenants.run(workspaceId, async () => {
      await sources.update(workspaceId, sourceId, { status: KnowledgeSourceStatus.Error });
      await syncRuns.insert(newSyncRun(testbed.ids.generate(), workspaceId, sourceId));
    });

    await expect(
      retryKnowledgeSource.execute(knowledgeCtx(workspaceId), {
        id: publicKnowledgeSourceId(testbed, sourceId),
      }),
    ).rejects.toBeInstanceOf(KnowledgeSourceBusyError);
  });
});
