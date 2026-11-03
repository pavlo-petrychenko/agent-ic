import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  KnowledgeDocumentStatus,
  KnowledgeSourceKind,
  KnowledgeSourceStatus,
} from '@/modules/knowledge/constants/knowledge.constants';
import { KnowledgeDocumentNotInSourceError } from '@/modules/knowledge/errors/knowledge-document-not-in-source.error';
import { KnowledgeDocumentNotRemovableError } from '@/modules/knowledge/errors/knowledge-document-not-removable.error';
import { KnowledgeSourceBusyError } from '@/modules/knowledge/errors/knowledge-source-busy.error';
import { KnowledgeSourceLastDocumentError } from '@/modules/knowledge/errors/knowledge-source-last-document.error';
import { KnowledgeSourceNotFoundError } from '@/modules/knowledge/errors/knowledge-source-not-found.error';
import { ChunksRepository } from '@/modules/knowledge/repositories/chunks.repository';
import { DocumentsRepository } from '@/modules/knowledge/repositories/documents.repository';
import { KnowledgeBasesRepository } from '@/modules/knowledge/repositories/knowledge-bases.repository';
import { SectionsRepository } from '@/modules/knowledge/repositories/sections.repository';
import { SourcesRepository } from '@/modules/knowledge/repositories/sources.repository';
import { RemoveSourceDocumentUseCase } from '@/modules/knowledge/use-cases/remove-source-document.use-case';
import { JobsService } from '@/platform/queues/services/jobs.service';
import {
  createKnowledgeTestbed,
  knowledgeCtx,
  publicKnowledgeDocumentId,
  publicKnowledgeSourceId,
  seedKnowledgeBase,
  seedKnowledgeChunk,
  seedKnowledgeConnection,
  seedKnowledgeDocument,
  seedKnowledgeSection,
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

describe('RemoveSourceDocumentUseCase', () => {
  let testbed: KnowledgeTestbed;
  let removeSourceDocument: RemoveSourceDocumentUseCase;
  let knowledgeBases: KnowledgeBasesRepository;
  let sources: SourcesRepository;
  let documents: DocumentsRepository;
  let sections: SectionsRepository;
  let chunks: ChunksRepository;
  let jobs: FakeJobsService;

  beforeAll(async () => {
    jobs = new FakeJobsService();
    testbed = await createKnowledgeTestbed([{ token: JobsService, value: jobs }]);
    removeSourceDocument = testbed.module.get(RemoveSourceDocumentUseCase);
    knowledgeBases = testbed.module.get(KnowledgeBasesRepository);
    sources = testbed.module.get(SourcesRepository);
    documents = testbed.module.get(DocumentsRepository);
    sections = testbed.module.get(SectionsRepository);
    chunks = testbed.module.get(ChunksRepository);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  beforeEach(() => {
    jobs.enqueued.length = 0;
  });

  const seedGoogleSource = async (
    workspaceId: string,
    knowledgeBaseId: string,
    title: string = 'Google Docs (2)',
  ): Promise<string> => {
    const connectionId = await seedKnowledgeConnection(testbed, workspaceId);
    return seedKnowledgeSource(testbed, workspaceId, knowledgeBaseId, {
      kind: KnowledgeSourceKind.GoogleDocs,
      connectionId,
      title,
      status: KnowledgeSourceStatus.Ready,
    });
  };

  const markIndexed = async (
    workspaceId: string,
    documentIds: readonly string[],
  ): Promise<void> => {
    await testbed.tenants.run(workspaceId, async () => {
      for (const documentId of documentIds) {
        await documents.update(workspaceId, documentId, {
          status: KnowledgeDocumentStatus.Indexed,
          activeGeneration: 1,
        });
      }
    });
  };

  it('moves a shared document to another source and keeps its index', async () => {
    const workspaceId = testbed.ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    const ownerSourceId = await seedGoogleSource(workspaceId, knowledgeBaseId);
    const referencingSourceId = await seedGoogleSource(workspaceId, knowledgeBaseId, 'Policies');
    const sharedDocumentId = await seedKnowledgeDocument(
      testbed,
      workspaceId,
      knowledgeBaseId,
      ownerSourceId,
      { title: 'Prices' },
    );
    const remainingDocumentId = await seedKnowledgeDocument(
      testbed,
      workspaceId,
      knowledgeBaseId,
      ownerSourceId,
      { title: 'Services' },
    );
    await seedSourceDocument(
      testbed,
      workspaceId,
      knowledgeBaseId,
      referencingSourceId,
      sharedDocumentId,
    );
    const sectionId = await seedKnowledgeSection(
      testbed,
      workspaceId,
      knowledgeBaseId,
      sharedDocumentId,
    );
    const chunkId = await seedKnowledgeChunk(
      testbed,
      workspaceId,
      knowledgeBaseId,
      sharedDocumentId,
      sectionId,
    );
    await markIndexed(workspaceId, [sharedDocumentId, remainingDocumentId]);
    await testbed.tenants.run(workspaceId, async () => {
      await chunks.update(workspaceId, chunkId, { generation: 1 });
      await sources.update(workspaceId, ownerSourceId, {
        status: KnowledgeSourceStatus.Ready,
        documentCount: 2,
        chunkCount: 1,
      });
      await sources.update(workspaceId, referencingSourceId, {
        status: KnowledgeSourceStatus.Ready,
        documentCount: 1,
        chunkCount: 1,
      });
    });

    const result = await removeSourceDocument.execute(knowledgeCtx(workspaceId), {
      sourceId: publicKnowledgeSourceId(testbed, ownerSourceId),
      documentId: publicKnowledgeDocumentId(testbed, sharedDocumentId),
    });
    const stored = await testbed.tenants.run(workspaceId, async () => ({
      ownerSource: await sources.findById(workspaceId, ownerSourceId),
      referencingSource: await sources.findById(workspaceId, referencingSourceId),
      document: await documents.findById(workspaceId, sharedDocumentId),
      ownerDocuments: await documents.listBySource(workspaceId, ownerSourceId),
      referencingDocuments: await documents.listBySource(workspaceId, referencingSourceId),
      section: await sections.findById(workspaceId, sectionId),
      chunk: await chunks.findById(workspaceId, chunkId),
    }));

    expect(result).toEqual({
      sourceId: publicKnowledgeSourceId(testbed, ownerSourceId),
      documentId: publicKnowledgeDocumentId(testbed, sharedDocumentId),
    });
    expect(stored.ownerSource).toMatchObject({
      title: 'Services',
      status: KnowledgeSourceStatus.Ready,
      documentCount: 1,
      chunkCount: 0,
    });
    expect(stored.referencingSource).toMatchObject({ title: 'Policies', documentCount: 1 });
    expect(stored.document).toMatchObject({
      sourceId: referencingSourceId,
      status: KnowledgeDocumentStatus.Indexed,
    });
    expect(stored.ownerDocuments.map((document) => document.id)).toEqual([remainingDocumentId]);
    expect(stored.referencingDocuments.map((document) => document.id)).toEqual([sharedDocumentId]);
    expect(stored.section).not.toBeNull();
    expect(stored.chunk).not.toBeNull();
    expect(jobs.enqueued).toHaveLength(0);
  });

  it('removes a referenced document without touching its owner', async () => {
    const workspaceId = testbed.ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    const ownerSourceId = await seedGoogleSource(workspaceId, knowledgeBaseId);
    const referencingSourceId = await seedGoogleSource(workspaceId, knowledgeBaseId, 'Google Docs');
    const sharedDocumentId = await seedKnowledgeDocument(
      testbed,
      workspaceId,
      knowledgeBaseId,
      ownerSourceId,
    );
    const remainingDocumentId = await seedKnowledgeDocument(
      testbed,
      workspaceId,
      knowledgeBaseId,
      referencingSourceId,
    );
    await seedSourceDocument(
      testbed,
      workspaceId,
      knowledgeBaseId,
      referencingSourceId,
      sharedDocumentId,
    );
    await markIndexed(workspaceId, [sharedDocumentId, remainingDocumentId]);
    await testbed.tenants.run(workspaceId, async () => {
      await sources.update(workspaceId, ownerSourceId, {
        status: KnowledgeSourceStatus.Ready,
        documentCount: 1,
      });
      await sources.update(workspaceId, referencingSourceId, {
        status: KnowledgeSourceStatus.Ready,
        documentCount: 2,
      });
    });

    await removeSourceDocument.execute(knowledgeCtx(workspaceId), {
      sourceId: publicKnowledgeSourceId(testbed, referencingSourceId),
      documentId: publicKnowledgeDocumentId(testbed, sharedDocumentId),
    });
    const stored = await testbed.tenants.run(workspaceId, async () => ({
      document: await documents.findById(workspaceId, sharedDocumentId),
      ownerDocuments: await documents.listBySource(workspaceId, ownerSourceId),
      referencingDocuments: await documents.listBySource(workspaceId, referencingSourceId),
      source: await sources.findById(workspaceId, referencingSourceId),
    }));

    expect(stored.document).toMatchObject({
      sourceId: ownerSourceId,
      status: KnowledgeDocumentStatus.Indexed,
    });
    expect(stored.ownerDocuments.map((document) => document.id)).toEqual([sharedDocumentId]);
    expect(stored.referencingDocuments.map((document) => document.id)).toEqual([
      remainingDocumentId,
    ]);
    expect(stored.source).toMatchObject({ documentCount: 1 });
    expect(jobs.enqueued).toHaveLength(0);
  });

  it('soft deletes a document that no other source uses and enqueues cleanup', async () => {
    const workspaceId = testbed.ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    const sourceId = await seedGoogleSource(workspaceId, knowledgeBaseId);
    const removedDocumentId = await seedKnowledgeDocument(
      testbed,
      workspaceId,
      knowledgeBaseId,
      sourceId,
      { title: 'Prices' },
    );
    const remainingDocumentId = await seedKnowledgeDocument(
      testbed,
      workspaceId,
      knowledgeBaseId,
      sourceId,
      { title: 'Services' },
    );
    const sectionId = await seedKnowledgeSection(
      testbed,
      workspaceId,
      knowledgeBaseId,
      removedDocumentId,
    );
    const chunkId = await seedKnowledgeChunk(
      testbed,
      workspaceId,
      knowledgeBaseId,
      removedDocumentId,
      sectionId,
    );
    await markIndexed(workspaceId, [removedDocumentId, remainingDocumentId]);
    await testbed.tenants.run(workspaceId, async () => {
      await chunks.update(workspaceId, chunkId, { generation: 1 });
      await sources.update(workspaceId, sourceId, {
        status: KnowledgeSourceStatus.Ready,
        documentCount: 2,
        chunkCount: 1,
      });
      await knowledgeBases.update(workspaceId, knowledgeBaseId, {
        documentCount: 2,
        chunkCount: 1,
      });
    });

    await removeSourceDocument.execute(knowledgeCtx(workspaceId), {
      sourceId: publicKnowledgeSourceId(testbed, sourceId),
      documentId: publicKnowledgeDocumentId(testbed, removedDocumentId),
    });
    const stored = await testbed.tenants.run(workspaceId, async () => ({
      source: await sources.findById(workspaceId, sourceId),
      document: await documents.findByIdIncludingDeleted(workspaceId, removedDocumentId),
      section: await sections.findById(workspaceId, sectionId),
      chunk: await chunks.findById(workspaceId, chunkId),
      knowledgeBase: await knowledgeBases.findById(workspaceId, knowledgeBaseId),
    }));

    expect(stored.source).toMatchObject({
      title: 'Services',
      status: KnowledgeSourceStatus.Ready,
      documentCount: 1,
      chunkCount: 0,
    });
    expect(stored.document).toMatchObject({
      status: KnowledgeDocumentStatus.Removed,
    });
    expect(stored.document?.deletedAt).not.toBeNull();
    expect(stored.section).toBeNull();
    expect(stored.chunk).toBeNull();
    expect(stored.knowledgeBase).toMatchObject({ documentCount: 1, chunkCount: 0 });
    expect(jobs.enqueued).toEqual([
      {
        name: 'clean-up-knowledge-document-files',
        data: { documentId: removedDocumentId },
      },
    ]);
  });

  it('keeps a custom source title', async () => {
    const workspaceId = testbed.ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    const sourceId = await seedGoogleSource(workspaceId, knowledgeBaseId, 'Custom title');
    const firstDocumentId = await seedKnowledgeDocument(
      testbed,
      workspaceId,
      knowledgeBaseId,
      sourceId,
    );
    const secondDocumentId = await seedKnowledgeDocument(
      testbed,
      workspaceId,
      knowledgeBaseId,
      sourceId,
    );
    await markIndexed(workspaceId, [firstDocumentId, secondDocumentId]);
    await testbed.tenants.run(workspaceId, () =>
      sources.update(workspaceId, sourceId, {
        status: KnowledgeSourceStatus.Ready,
        documentCount: 2,
      }),
    );

    await removeSourceDocument.execute(knowledgeCtx(workspaceId), {
      sourceId: publicKnowledgeSourceId(testbed, sourceId),
      documentId: publicKnowledgeDocumentId(testbed, firstDocumentId),
    });
    const source = await testbed.tenants.run(workspaceId, () =>
      sources.findById(workspaceId, sourceId),
    );

    expect(source?.title).toBe('Custom title');
  });

  it('refuses the last document in a source', async () => {
    const workspaceId = testbed.ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    const sourceId = await seedGoogleSource(workspaceId, knowledgeBaseId);
    const documentId = await seedKnowledgeDocument(testbed, workspaceId, knowledgeBaseId, sourceId);
    await markIndexed(workspaceId, [documentId]);

    await expect(
      removeSourceDocument.execute(knowledgeCtx(workspaceId), {
        sourceId: publicKnowledgeSourceId(testbed, sourceId),
        documentId: publicKnowledgeDocumentId(testbed, documentId),
      }),
    ).rejects.toBeInstanceOf(KnowledgeSourceLastDocumentError);
  });

  it('refuses a document that is not part of the source', async () => {
    const workspaceId = testbed.ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    const sourceId = await seedGoogleSource(workspaceId, knowledgeBaseId);
    const otherSourceId = await seedGoogleSource(workspaceId, knowledgeBaseId);
    const firstDocumentId = await seedKnowledgeDocument(
      testbed,
      workspaceId,
      knowledgeBaseId,
      sourceId,
    );
    const secondDocumentId = await seedKnowledgeDocument(
      testbed,
      workspaceId,
      knowledgeBaseId,
      sourceId,
    );
    const foreignDocumentId = await seedKnowledgeDocument(
      testbed,
      workspaceId,
      knowledgeBaseId,
      otherSourceId,
    );
    await markIndexed(workspaceId, [firstDocumentId, secondDocumentId, foreignDocumentId]);
    await testbed.tenants.run(workspaceId, async () => {
      await sources.update(workspaceId, sourceId, {
        status: KnowledgeSourceStatus.Ready,
        documentCount: 2,
      });
      await sources.update(workspaceId, otherSourceId, {
        status: KnowledgeSourceStatus.Ready,
        documentCount: 1,
      });
    });

    await expect(
      removeSourceDocument.execute(knowledgeCtx(workspaceId), {
        sourceId: publicKnowledgeSourceId(testbed, sourceId),
        documentId: publicKnowledgeDocumentId(testbed, foreignDocumentId),
      }),
    ).rejects.toBeInstanceOf(KnowledgeDocumentNotInSourceError);
  });

  it('refuses while the source is busy', async () => {
    const workspaceId = testbed.ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    const sourceId = await seedGoogleSource(workspaceId, knowledgeBaseId);
    const documentId = await seedKnowledgeDocument(testbed, workspaceId, knowledgeBaseId, sourceId);
    await markIndexed(workspaceId, [documentId]);
    await testbed.tenants.run(workspaceId, () =>
      sources.update(workspaceId, sourceId, { status: KnowledgeSourceStatus.Indexing }),
    );

    await expect(
      removeSourceDocument.execute(knowledgeCtx(workspaceId), {
        sourceId: publicKnowledgeSourceId(testbed, sourceId),
        documentId: publicKnowledgeDocumentId(testbed, documentId),
      }),
    ).rejects.toBeInstanceOf(KnowledgeSourceBusyError);
  });

  it('refuses a document that is indexing', async () => {
    const workspaceId = testbed.ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    const sourceId = await seedGoogleSource(workspaceId, knowledgeBaseId);
    const firstDocumentId = await seedKnowledgeDocument(
      testbed,
      workspaceId,
      knowledgeBaseId,
      sourceId,
    );
    const secondDocumentId = await seedKnowledgeDocument(
      testbed,
      workspaceId,
      knowledgeBaseId,
      sourceId,
    );
    await markIndexed(workspaceId, [firstDocumentId]);
    await testbed.tenants.run(workspaceId, async () => {
      await documents.update(workspaceId, secondDocumentId, {
        status: KnowledgeDocumentStatus.Indexing,
        activeGeneration: 1,
      });
      await sources.update(workspaceId, sourceId, {
        status: KnowledgeSourceStatus.Ready,
        documentCount: 2,
      });
    });

    await expect(
      removeSourceDocument.execute(knowledgeCtx(workspaceId), {
        sourceId: publicKnowledgeSourceId(testbed, sourceId),
        documentId: publicKnowledgeDocumentId(testbed, secondDocumentId),
      }),
    ).rejects.toBeInstanceOf(KnowledgeDocumentNotRemovableError);
  });

  it('refuses an unknown source', async () => {
    const workspaceId = testbed.ids.generate();
    await seedKnowledgeBase(testbed, workspaceId);

    await expect(
      removeSourceDocument.execute(knowledgeCtx(workspaceId), {
        sourceId: publicKnowledgeSourceId(testbed, testbed.ids.generate()),
        documentId: publicKnowledgeDocumentId(testbed, testbed.ids.generate()),
      }),
    ).rejects.toBeInstanceOf(KnowledgeSourceNotFoundError);
  });
});
