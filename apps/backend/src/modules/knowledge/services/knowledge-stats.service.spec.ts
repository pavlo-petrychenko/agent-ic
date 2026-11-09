import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DocumentsRepository } from '@/modules/knowledge/repositories/documents.repository';
import { KnowledgeBasesRepository } from '@/modules/knowledge/repositories/knowledge-bases.repository';
import { KnowledgeChunksReader } from '@/modules/usage';
import {
  createKnowledgeTestbed,
  seedKnowledgeBase,
  seedKnowledgeChunk,
  seedKnowledgeDocument,
  seedKnowledgeSection,
  seedKnowledgeSource,
} from '@test/support/helpers/knowledge-testing.helpers';
import type { KnowledgeTestbed } from '@test/support/typedefs/knowledge-testing.typedefs';

describe('KnowledgeStatsService', () => {
  let testbed: KnowledgeTestbed;
  let reader: KnowledgeChunksReader;

  beforeAll(async () => {
    testbed = await createKnowledgeTestbed();
    reader = testbed.module.get(KnowledgeChunksReader);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('counts only active chunks of live documents and knowledge bases', async () => {
    const workspaceId = testbed.ids.generate();
    const otherWorkspaceId = testbed.ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    const sourceId = await seedKnowledgeSource(testbed, workspaceId, knowledgeBaseId);
    const documentId = await seedKnowledgeDocument(
      testbed,
      workspaceId,
      knowledgeBaseId,
      sourceId,
      {
        activeGeneration: 1,
      },
    );
    const sectionId = await seedKnowledgeSection(
      testbed,
      workspaceId,
      knowledgeBaseId,
      documentId,
      {
        generation: 1,
      },
    );
    await seedKnowledgeChunk(testbed, workspaceId, knowledgeBaseId, documentId, sectionId, {
      generation: 1,
    });
    await seedKnowledgeChunk(testbed, workspaceId, knowledgeBaseId, documentId, sectionId, {
      generation: 1,
      ordinal: 1,
    });
    await seedKnowledgeChunk(testbed, workspaceId, knowledgeBaseId, documentId, sectionId, {
      generation: 0,
    });

    const deletedDocumentSourceId = await seedKnowledgeSource(
      testbed,
      workspaceId,
      knowledgeBaseId,
    );
    const deletedDocumentId = await seedKnowledgeDocument(
      testbed,
      workspaceId,
      knowledgeBaseId,
      deletedDocumentSourceId,
      { activeGeneration: 1 },
    );
    const deletedDocumentSectionId = await seedKnowledgeSection(
      testbed,
      workspaceId,
      knowledgeBaseId,
      deletedDocumentId,
      { generation: 1 },
    );
    await seedKnowledgeChunk(
      testbed,
      workspaceId,
      knowledgeBaseId,
      deletedDocumentId,
      deletedDocumentSectionId,
      { generation: 1 },
    );
    await testbed.tenants.run(workspaceId, () =>
      testbed.module
        .get(DocumentsRepository)
        .softDelete(workspaceId, deletedDocumentId, testbed.clock.now()),
    );

    const deletedKnowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId, {
      name: 'Deleted handbook',
      toolName: 'search_deleted_handbook',
    });
    const deletedKnowledgeBaseSourceId = await seedKnowledgeSource(
      testbed,
      workspaceId,
      deletedKnowledgeBaseId,
    );
    const deletedKnowledgeBaseDocumentId = await seedKnowledgeDocument(
      testbed,
      workspaceId,
      deletedKnowledgeBaseId,
      deletedKnowledgeBaseSourceId,
      { activeGeneration: 1 },
    );
    const deletedKnowledgeBaseSectionId = await seedKnowledgeSection(
      testbed,
      workspaceId,
      deletedKnowledgeBaseId,
      deletedKnowledgeBaseDocumentId,
      { generation: 1 },
    );
    await seedKnowledgeChunk(
      testbed,
      workspaceId,
      deletedKnowledgeBaseId,
      deletedKnowledgeBaseDocumentId,
      deletedKnowledgeBaseSectionId,
      { generation: 1 },
    );
    await testbed.tenants.run(workspaceId, () =>
      testbed.module
        .get(KnowledgeBasesRepository)
        .softDelete(workspaceId, deletedKnowledgeBaseId, testbed.clock.now()),
    );

    const otherKnowledgeBaseId = await seedKnowledgeBase(testbed, otherWorkspaceId);
    const otherSourceId = await seedKnowledgeSource(
      testbed,
      otherWorkspaceId,
      otherKnowledgeBaseId,
    );
    const otherDocumentId = await seedKnowledgeDocument(
      testbed,
      otherWorkspaceId,
      otherKnowledgeBaseId,
      otherSourceId,
      { activeGeneration: 1 },
    );
    const otherSectionId = await seedKnowledgeSection(
      testbed,
      otherWorkspaceId,
      otherKnowledgeBaseId,
      otherDocumentId,
      { generation: 1 },
    );
    await seedKnowledgeChunk(
      testbed,
      otherWorkspaceId,
      otherKnowledgeBaseId,
      otherDocumentId,
      otherSectionId,
      { generation: 1 },
    );

    await expect(
      testbed.tenants.run(workspaceId, () => reader.workspaceChunkCount(workspaceId)),
    ).resolves.toBe(2);
    await expect(
      testbed.tenants.run(otherWorkspaceId, () => reader.workspaceChunkCount(otherWorkspaceId)),
    ).resolves.toBe(1);
  });
});
