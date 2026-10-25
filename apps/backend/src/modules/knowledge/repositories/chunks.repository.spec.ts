import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ChunksRepository } from '@/modules/knowledge/repositories/chunks.repository';
import {
  TEST_CHUNK_CONTENT,
  TEST_CHUNK_NEW_CONTENT,
} from '@test/support/constants/knowledge-testing.constants';
import { newChunk } from '@test/support/fixtures/knowledge.fixture';
import {
  createKnowledgeTestbed,
  seedKnowledgeBase,
  seedKnowledgeDocument,
  seedKnowledgeSection,
  seedKnowledgeSource,
} from '@test/support/helpers/knowledge-testing.helpers';
import { ensureWorkspaceRow } from '@test/support/helpers/parent-rows.helpers';
import type { KnowledgeTestbed } from '@test/support/typedefs/knowledge-testing.typedefs';

describe('ChunksRepository', () => {
  let testbed: KnowledgeTestbed;
  let repository: ChunksRepository;

  beforeAll(async () => {
    testbed = await createKnowledgeTestbed();
    repository = testbed.module.get(ChunksRepository);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('stores, updates, deletes and isolates a chunk', async () => {
    const workspaceA = testbed.ids.generate();
    const workspaceB = testbed.ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceA);
    const sourceId = await seedKnowledgeSource(testbed, workspaceA, knowledgeBaseId);
    const documentId = await seedKnowledgeDocument(testbed, workspaceA, knowledgeBaseId, sourceId);
    const sectionId = await seedKnowledgeSection(testbed, workspaceA, knowledgeBaseId, documentId);
    await ensureWorkspaceRow(testbed.module, workspaceB);

    const inserted = await testbed.tenants.run(workspaceA, () =>
      repository.insert(
        newChunk(testbed.ids.generate(), workspaceA, knowledgeBaseId, documentId, sectionId),
      ),
    );
    expect(inserted).toMatchObject({
      workspaceId: workspaceA,
      kbId: knowledgeBaseId,
      documentId,
      sectionId,
      content: TEST_CHUNK_CONTENT,
      createdAt: testbed.clock.now(),
    });

    const updated = await testbed.tenants.run(workspaceA, () =>
      repository.update(workspaceA, inserted.id, { content: TEST_CHUNK_NEW_CONTENT }),
    );
    const seen = await testbed.tenants.run(workspaceB, async () => ({
      found: await repository.findById(workspaceA, inserted.id),
      updated: await repository.update(workspaceA, inserted.id, {
        content: TEST_CHUNK_NEW_CONTENT,
      }),
      deleted: await repository.deleteById(workspaceA, inserted.id),
    }));
    const deleted = await testbed.tenants.run(workspaceA, () =>
      repository.deleteById(workspaceA, inserted.id),
    );
    const found = await testbed.tenants.run(workspaceA, () =>
      repository.findById(workspaceA, inserted.id),
    );

    expect(updated).toMatchObject({ content: TEST_CHUNK_NEW_CONTENT });
    expect(seen).toEqual({ found: null, updated: null, deleted: false });
    expect(deleted).toBe(true);
    expect(found).toBeNull();
  });
});
