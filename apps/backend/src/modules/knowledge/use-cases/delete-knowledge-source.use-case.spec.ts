import { ErrorReason } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  KnowledgeDocumentStatus,
  KnowledgeSourceStatus,
} from '@/modules/knowledge/constants/knowledge.constants';
import { KnowledgeSourceBusyError } from '@/modules/knowledge/errors/knowledge-source-busy.error';
import { KnowledgeSourceNotFoundError } from '@/modules/knowledge/errors/knowledge-source-not-found.error';
import { ChunkTermsRepository } from '@/modules/knowledge/repositories/chunk-terms.repository';
import { ChunksRepository } from '@/modules/knowledge/repositories/chunks.repository';
import { DocumentsRepository } from '@/modules/knowledge/repositories/documents.repository';
import { KnowledgeBasesRepository } from '@/modules/knowledge/repositories/knowledge-bases.repository';
import { SectionsRepository } from '@/modules/knowledge/repositories/sections.repository';
import { SourcesRepository } from '@/modules/knowledge/repositories/sources.repository';
import { CleanUpKnowledgeSourceFilesUseCase } from '@/modules/knowledge/use-cases/clean-up-knowledge-source-files.use-case';
import { DeleteKnowledgeSourceUseCase } from '@/modules/knowledge/use-cases/delete-knowledge-source.use-case';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { IdService } from '@/platform/ids/services/id.service';
import { TEST_CHUNK_TERM } from '@test/support/constants/knowledge-testing.constants';
import { workspaceSystemCtx } from '@test/support/fixtures/conversation.fixture';
import {
  createKnowledgeTestbed,
  knowledgeCtx,
  publicKnowledgeSourceId,
  seedKnowledgeBase,
  seedKnowledgeChunk,
  seedKnowledgeChunkTerm,
  seedKnowledgeDocument,
  seedKnowledgeSection,
  seedKnowledgeSource,
} from '@test/support/helpers/knowledge-testing.helpers';
import type { KnowledgeTestbed } from '@test/support/typedefs/knowledge-testing.typedefs';

describe('DeleteKnowledgeSourceUseCase', () => {
  let testbed: KnowledgeTestbed;
  let deleteKnowledgeSource: DeleteKnowledgeSourceUseCase;
  let cleanUpKnowledgeSourceFiles: CleanUpKnowledgeSourceFilesUseCase;
  let knowledgeBases: KnowledgeBasesRepository;
  let sources: SourcesRepository;
  let documents: DocumentsRepository;
  let sections: SectionsRepository;
  let chunks: ChunksRepository;
  let chunkTerms: ChunkTermsRepository;
  let tenants: TenantTransactionService;
  let ids: IdService;

  beforeAll(async () => {
    testbed = await createKnowledgeTestbed();
    deleteKnowledgeSource = testbed.module.get(DeleteKnowledgeSourceUseCase);
    cleanUpKnowledgeSourceFiles = testbed.module.get(CleanUpKnowledgeSourceFilesUseCase);
    knowledgeBases = testbed.module.get(KnowledgeBasesRepository);
    sources = testbed.module.get(SourcesRepository);
    documents = testbed.module.get(DocumentsRepository);
    sections = testbed.module.get(SectionsRepository);
    chunks = testbed.module.get(ChunksRepository);
    chunkTerms = testbed.module.get(ChunkTermsRepository);
    tenants = testbed.module.get(TenantTransactionService);
    ids = testbed.module.get(IdService);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('soft deletes a source, clears its content and refreshes the knowledge base counts', async () => {
    const workspaceId = ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    const sourceId = await seedKnowledgeSource(testbed, workspaceId, knowledgeBaseId);
    const documentId = await seedKnowledgeDocument(testbed, workspaceId, knowledgeBaseId, sourceId);
    const sectionId = await seedKnowledgeSection(testbed, workspaceId, knowledgeBaseId, documentId);
    const chunkId = await seedKnowledgeChunk(
      testbed,
      workspaceId,
      knowledgeBaseId,
      documentId,
      sectionId,
    );
    await seedKnowledgeChunkTerm(testbed, workspaceId, knowledgeBaseId, chunkId);
    const originalKey = `workspaces/${workspaceId}/knowledge/documents/${documentId}/original.pdf`;
    const pendingKey = `workspaces/${workspaceId}/knowledge/documents/${documentId}/pending.pdf`;
    const contentKey = `workspaces/${workspaceId}/knowledge/documents/${documentId}/content.md`;
    await testbed.storage.put(originalKey, Buffer.from('old'), 'application/pdf');
    await testbed.storage.put(pendingKey, Buffer.from('new'), 'application/pdf');
    await testbed.storage.put(contentKey, Buffer.from('markdown'), 'text/markdown');
    await tenants.run(workspaceId, async () => {
      await sources.update(workspaceId, sourceId, {
        status: KnowledgeSourceStatus.Ready,
        documentCount: 1,
        chunkCount: 1,
      });
      await documents.update(workspaceId, documentId, {
        status: KnowledgeDocumentStatus.Indexed,
        originalStorageKey: originalKey,
        pendingOriginalStorageKey: pendingKey,
        contentStorageKey: contentKey,
        activeGeneration: 1,
      });
      await chunks.update(workspaceId, chunkId, { generation: 1 });
      await knowledgeBases.update(workspaceId, knowledgeBaseId, {
        documentCount: 1,
        chunkCount: 1,
      });
    });

    const result = await deleteKnowledgeSource.execute(knowledgeCtx(workspaceId), {
      id: publicKnowledgeSourceId(testbed, sourceId),
    });

    const stored = await tenants.run(workspaceId, async () => ({
      knowledgeBase: await knowledgeBases.findById(workspaceId, knowledgeBaseId),
      source: await sources.findById(workspaceId, sourceId),
      deletedSource: await sources.findByIdIncludingDeleted(workspaceId, sourceId),
      document: await documents.findById(workspaceId, documentId),
      section: await sections.findById(workspaceId, sectionId),
      chunk: await chunks.findById(workspaceId, chunkId),
      term: await chunkTerms.find(workspaceId, chunkId, TEST_CHUNK_TERM),
    }));
    expect(result).toEqual({ id: publicKnowledgeSourceId(testbed, sourceId) });
    expect(stored.knowledgeBase).toMatchObject({ documentCount: 0, chunkCount: 0 });
    expect(stored.source).toBeNull();
    expect(stored.deletedSource).not.toBeNull();
    expect(stored.document).toBeNull();
    expect(stored.section).toBeNull();
    expect(stored.chunk).toBeNull();
    expect(stored.term).toBeNull();
    await expect(testbed.storage.head(originalKey)).resolves.not.toBeNull();
    await expect(testbed.storage.head(pendingKey)).resolves.not.toBeNull();
    await expect(testbed.storage.head(contentKey)).resolves.not.toBeNull();

    await cleanUpKnowledgeSourceFiles.execute(workspaceSystemCtx(workspaceId), { sourceId });

    const cleaned = await tenants.run(workspaceId, () =>
      sources.findByIdIncludingDeleted(workspaceId, sourceId),
    );
    expect(cleaned).toBeNull();
    await expect(testbed.storage.head(originalKey)).resolves.toBeNull();
    await expect(testbed.storage.head(pendingKey)).resolves.toBeNull();
    await expect(testbed.storage.head(contentKey)).resolves.toBeNull();
  });

  it('refuses a source that is still being indexed', async () => {
    const workspaceId = ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    const sourceId = await seedKnowledgeSource(testbed, workspaceId, knowledgeBaseId);

    const attempt = deleteKnowledgeSource.execute(knowledgeCtx(workspaceId), {
      id: publicKnowledgeSourceId(testbed, sourceId),
    });

    await expect(attempt).rejects.toBeInstanceOf(KnowledgeSourceBusyError);
    await expect(attempt).rejects.toMatchObject({
      kind: DomainErrorKind.Conflict,
      reason: ErrorReason.KnowledgeSourceBusy,
    });
    const source = await tenants.run(workspaceId, () => sources.findById(workspaceId, sourceId));
    expect(source).not.toBeNull();
  });

  it('refuses an unknown source', async () => {
    const workspaceId = ids.generate();
    await seedKnowledgeBase(testbed, workspaceId);

    const attempt = deleteKnowledgeSource.execute(knowledgeCtx(workspaceId), {
      id: publicKnowledgeSourceId(testbed, ids.generate()),
    });

    await expect(attempt).rejects.toBeInstanceOf(KnowledgeSourceNotFoundError);
  });
});
