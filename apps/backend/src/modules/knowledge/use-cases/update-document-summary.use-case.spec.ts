import { KNOWLEDGE_SUMMARY_MAX_LENGTH } from '@agent-ic/contracts';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  KnowledgeDocumentStatus,
  KnowledgeSourceKind,
  KnowledgeSourceStatus,
  KnowledgeSummarySource,
} from '@/modules/knowledge/constants/knowledge.constants';
import { InvalidKnowledgeInputError } from '@/modules/knowledge/errors/invalid-knowledge-input.error';
import { KnowledgeDocumentBusyError } from '@/modules/knowledge/errors/knowledge-document-busy.error';
import { KnowledgeDocumentNotEditableError } from '@/modules/knowledge/errors/knowledge-document-not-editable.error';
import { KnowledgeDocumentNotFoundError } from '@/modules/knowledge/errors/knowledge-document-not-found.error';
import { KnowledgeSourceBusyError } from '@/modules/knowledge/errors/knowledge-source-busy.error';
import { DocumentsRepository } from '@/modules/knowledge/repositories/documents.repository';
import { SourcesRepository } from '@/modules/knowledge/repositories/sources.repository';
import { UpdateDocumentSummaryUseCase } from '@/modules/knowledge/use-cases/update-document-summary.use-case';
import { JobsService } from '@/platform/queues/services/jobs.service';
import { KNOWLEDGE_TEST_START } from '@test/support/constants/knowledge-testing.constants';
import {
  createKnowledgeTestbed,
  knowledgeCtx,
  publicKnowledgeDocumentId,
  seedKnowledgeBase,
  seedKnowledgeConnection,
  seedKnowledgeDocument,
  seedKnowledgeSource,
} from '@test/support/helpers/knowledge-testing.helpers';
import type { KnowledgeTestbed } from '@test/support/typedefs/knowledge-testing.typedefs';

const SUMMARY = 'A refund policy with a five-day processing window.';
const NEXT_SUMMARY = 'A refund policy with a ten-day processing window.';

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

describe('UpdateDocumentSummaryUseCase', () => {
  let testbed: KnowledgeTestbed;
  let updateDocumentSummary: UpdateDocumentSummaryUseCase;
  let documents: DocumentsRepository;
  let sources: SourcesRepository;
  let jobs: FakeJobsService;

  beforeAll(async () => {
    jobs = new FakeJobsService();
    testbed = await createKnowledgeTestbed([{ token: JobsService, value: jobs }]);
    updateDocumentSummary = testbed.module.get(UpdateDocumentSummaryUseCase);
    documents = testbed.module.get(DocumentsRepository);
    sources = testbed.module.get(SourcesRepository);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  beforeEach(() => {
    jobs.enqueued.length = 0;
  });

  const seedIndexedGoogleDocument = async (workspaceId: string) => {
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    const connectionId = await seedKnowledgeConnection(testbed, workspaceId);
    const sourceId = await seedKnowledgeSource(testbed, workspaceId, knowledgeBaseId, {
      kind: KnowledgeSourceKind.GoogleDocs,
      connectionId,
      status: KnowledgeSourceStatus.Ready,
    });
    const documentId = await seedKnowledgeDocument(testbed, workspaceId, knowledgeBaseId, sourceId);
    await testbed.tenants.run(workspaceId, () =>
      documents.update(workspaceId, documentId, {
        status: KnowledgeDocumentStatus.Indexed,
        summary: SUMMARY,
        summarySource: KnowledgeSummarySource.Auto,
        summaryUpdatedAt: KNOWLEDGE_TEST_START,
        activeGeneration: 1,
        contentStorageKey: 'content.md',
      }),
    );
    return { knowledgeBaseId, sourceId, documentId };
  };

  it('saves a user summary and enqueues a reindex when the text changed', async () => {
    const workspaceId = testbed.ids.generate();
    const { sourceId, documentId } = await seedIndexedGoogleDocument(workspaceId);
    testbed.clock.advanceBy(60_000);
    const now = testbed.clock.now();

    const view = await updateDocumentSummary.execute(knowledgeCtx(workspaceId), {
      id: publicKnowledgeDocumentId(testbed, documentId),
      summary: `  ${NEXT_SUMMARY}  `,
    });
    const stored = await testbed.tenants.run(workspaceId, async () => ({
      document: await documents.findById(workspaceId, documentId),
      source: await sources.findById(workspaceId, sourceId),
    }));

    expect(view).toMatchObject({
      id: publicKnowledgeDocumentId(testbed, documentId),
      summary: NEXT_SUMMARY,
      status: KnowledgeDocumentStatus.Indexing,
    });
    expect(stored.document).toMatchObject({
      summary: NEXT_SUMMARY,
      summarySource: KnowledgeSummarySource.User,
      summaryUpdatedAt: now,
      status: KnowledgeDocumentStatus.Indexing,
    });
    expect(jobs.enqueued).toEqual([{ name: 'reindex-knowledge-document', data: { documentId } }]);
  });

  it('keeps the current generation when the text is unchanged', async () => {
    const workspaceId = testbed.ids.generate();
    const { documentId } = await seedIndexedGoogleDocument(workspaceId);
    const now = testbed.clock.now();

    const view = await updateDocumentSummary.execute(knowledgeCtx(workspaceId), {
      id: publicKnowledgeDocumentId(testbed, documentId),
      summary: SUMMARY,
    });
    const stored = await testbed.tenants.run(workspaceId, () =>
      documents.findById(workspaceId, documentId),
    );

    expect(view.status).toBe(KnowledgeDocumentStatus.Indexed);
    expect(stored).toMatchObject({
      summary: SUMMARY,
      summarySource: KnowledgeSummarySource.User,
      summaryUpdatedAt: now,
      status: KnowledgeDocumentStatus.Indexed,
    });
    expect(jobs.enqueued).toHaveLength(0);
  });

  it('refuses a document that is still indexing', async () => {
    const workspaceId = testbed.ids.generate();
    const { documentId } = await seedIndexedGoogleDocument(workspaceId);
    await testbed.tenants.run(workspaceId, () =>
      documents.update(workspaceId, documentId, {
        status: KnowledgeDocumentStatus.Indexing,
      }),
    );

    await expect(
      updateDocumentSummary.execute(knowledgeCtx(workspaceId), {
        id: publicKnowledgeDocumentId(testbed, documentId),
        summary: NEXT_SUMMARY,
      }),
    ).rejects.toBeInstanceOf(KnowledgeDocumentBusyError);
  });

  it('refuses a stale document', async () => {
    const workspaceId = testbed.ids.generate();
    const { documentId } = await seedIndexedGoogleDocument(workspaceId);
    await testbed.tenants.run(workspaceId, () =>
      documents.update(workspaceId, documentId, { staleAt: KNOWLEDGE_TEST_START }),
    );

    await expect(
      updateDocumentSummary.execute(knowledgeCtx(workspaceId), {
        id: publicKnowledgeDocumentId(testbed, documentId),
        summary: NEXT_SUMMARY,
      }),
    ).rejects.toBeInstanceOf(KnowledgeDocumentNotEditableError);
  });

  it('refuses an uploaded document', async () => {
    const workspaceId = testbed.ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    const sourceId = await seedKnowledgeSource(testbed, workspaceId, knowledgeBaseId, {
      kind: KnowledgeSourceKind.Upload,
      status: KnowledgeSourceStatus.Ready,
    });
    const documentId = await seedKnowledgeDocument(testbed, workspaceId, knowledgeBaseId, sourceId);
    await testbed.tenants.run(workspaceId, () =>
      documents.update(workspaceId, documentId, {
        status: KnowledgeDocumentStatus.Indexed,
        summary: SUMMARY,
      }),
    );

    await expect(
      updateDocumentSummary.execute(knowledgeCtx(workspaceId), {
        id: publicKnowledgeDocumentId(testbed, documentId),
        summary: NEXT_SUMMARY,
      }),
    ).rejects.toBeInstanceOf(KnowledgeDocumentNotEditableError);
  });

  it('refuses a document while its source is syncing', async () => {
    const workspaceId = testbed.ids.generate();
    const { documentId } = await seedIndexedGoogleDocument(workspaceId);
    await testbed.tenants.run(workspaceId, async () => {
      const document = await documents.findById(workspaceId, documentId);
      if (document === null) {
        throw new Error('Seeded document is missing');
      }
      await sources.update(workspaceId, document.sourceId, {
        status: KnowledgeSourceStatus.Indexing,
      });
    });

    await expect(
      updateDocumentSummary.execute(knowledgeCtx(workspaceId), {
        id: publicKnowledgeDocumentId(testbed, documentId),
        summary: NEXT_SUMMARY,
      }),
    ).rejects.toBeInstanceOf(KnowledgeSourceBusyError);
  });

  it('refuses a summary over the limit', async () => {
    const workspaceId = testbed.ids.generate();
    const { documentId } = await seedIndexedGoogleDocument(workspaceId);

    await expect(
      updateDocumentSummary.execute(knowledgeCtx(workspaceId), {
        id: publicKnowledgeDocumentId(testbed, documentId),
        summary: 'x'.repeat(KNOWLEDGE_SUMMARY_MAX_LENGTH + 1),
      }),
    ).rejects.toBeInstanceOf(InvalidKnowledgeInputError);
  });

  it('refuses an unknown document', async () => {
    const workspaceId = testbed.ids.generate();
    await seedKnowledgeBase(testbed, workspaceId);

    await expect(
      updateDocumentSummary.execute(knowledgeCtx(workspaceId), {
        id: publicKnowledgeDocumentId(testbed, testbed.ids.generate()),
        summary: NEXT_SUMMARY,
      }),
    ).rejects.toBeInstanceOf(KnowledgeDocumentNotFoundError);
  });
});
