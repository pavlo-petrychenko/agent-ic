import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { KnowledgeBaseNotFoundError } from '@/modules/knowledge/errors/knowledge-base-not-found.error';
import { ChunkTermsRepository } from '@/modules/knowledge/repositories/chunk-terms.repository';
import { ChunksRepository } from '@/modules/knowledge/repositories/chunks.repository';
import { DocumentsRepository } from '@/modules/knowledge/repositories/documents.repository';
import { KnowledgeBasesRepository } from '@/modules/knowledge/repositories/knowledge-bases.repository';
import { SectionsRepository } from '@/modules/knowledge/repositories/sections.repository';
import { SourcesRepository } from '@/modules/knowledge/repositories/sources.repository';
import { DeleteKnowledgeBaseUseCase } from '@/modules/knowledge/use-cases/delete-knowledge-base.use-case';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import { TEST_CHUNK_TERM, TEST_KB_NAME } from '@test/support/constants/knowledge-testing.constants';
import {
  createKnowledgeTestbed,
  knowledgeCtx,
  publicKnowledgeBaseId,
  seedKnowledgeBase,
  seedKnowledgeChunk,
  seedKnowledgeChunkTerm,
  seedKnowledgeDocument,
  seedKnowledgeSection,
  seedKnowledgeSource,
} from '@test/support/helpers/knowledge-testing.helpers';
import type { KnowledgeTestbed } from '@test/support/typedefs/knowledge-testing.typedefs';

describe('DeleteKnowledgeBaseUseCase', () => {
  let testbed: KnowledgeTestbed;
  let deleteKnowledgeBase: DeleteKnowledgeBaseUseCase;
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
    deleteKnowledgeBase = testbed.module.get(DeleteKnowledgeBaseUseCase);
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

  it('deletes a knowledge base with its sources and indexed content', async () => {
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
    const publicId = publicKnowledgeBaseId(testbed, knowledgeBaseId);

    const result = await deleteKnowledgeBase.execute(knowledgeCtx(workspaceId), {
      id: publicId,
    });

    const stored = await tenants.run(workspaceId, async () => ({
      knowledgeBase: await knowledgeBases.findById(workspaceId, knowledgeBaseId),
      byName: await knowledgeBases.findByName(workspaceId, TEST_KB_NAME),
      listed: await knowledgeBases.list(workspaceId),
      source: await sources.findById(workspaceId, sourceId),
      document: await documents.findById(workspaceId, documentId),
      section: await sections.findById(workspaceId, sectionId),
      chunk: await chunks.findById(workspaceId, chunkId),
      term: await chunkTerms.find(workspaceId, chunkId, TEST_CHUNK_TERM),
    }));
    expect(result).toEqual({ id: publicId });
    expect(stored).toEqual({
      knowledgeBase: null,
      byName: null,
      listed: [],
      source: null,
      document: null,
      section: null,
      chunk: null,
      term: null,
    });
  });

  it('refuses an unknown knowledge base', async () => {
    const workspaceId = ids.generate();
    const attempt = deleteKnowledgeBase.execute(knowledgeCtx(workspaceId), {
      id: publicKnowledgeBaseId(testbed, ids.generate()),
    });

    await expect(attempt).rejects.toBeInstanceOf(KnowledgeBaseNotFoundError);
  });
});
