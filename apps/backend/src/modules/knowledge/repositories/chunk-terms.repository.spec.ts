import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ChunkTermsRepository } from '@/modules/knowledge/repositories/chunk-terms.repository';
import {
  TEST_CHUNK_TERM,
  TEST_CHUNK_TERM_FREQUENCY,
} from '@test/support/constants/knowledge-testing.constants';
import { newChunkTerm } from '@test/support/fixtures/knowledge.fixture';
import {
  createKnowledgeTestbed,
  seedKnowledgeBase,
  seedKnowledgeChunk,
  seedKnowledgeDocument,
  seedKnowledgeSection,
  seedKnowledgeSource,
} from '@test/support/helpers/knowledge-testing.helpers';
import { ensureWorkspaceRow } from '@test/support/helpers/parent-rows.helpers';
import type { KnowledgeTestbed } from '@test/support/typedefs/knowledge-testing.typedefs';

describe('ChunkTermsRepository', () => {
  let testbed: KnowledgeTestbed;
  let repository: ChunkTermsRepository;

  beforeAll(async () => {
    testbed = await createKnowledgeTestbed();
    repository = testbed.module.get(ChunkTermsRepository);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('stores, updates, deletes and isolates a chunk term', async () => {
    const workspaceA = testbed.ids.generate();
    const workspaceB = testbed.ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceA);
    const sourceId = await seedKnowledgeSource(testbed, workspaceA, knowledgeBaseId);
    const documentId = await seedKnowledgeDocument(testbed, workspaceA, knowledgeBaseId, sourceId);
    const sectionId = await seedKnowledgeSection(testbed, workspaceA, knowledgeBaseId, documentId);
    const chunkId = await seedKnowledgeChunk(
      testbed,
      workspaceA,
      knowledgeBaseId,
      documentId,
      sectionId,
    );
    await ensureWorkspaceRow(testbed.module, workspaceB);

    const inserted = await testbed.tenants.run(workspaceA, () =>
      repository.insert(newChunkTerm(workspaceA, knowledgeBaseId, chunkId)),
    );
    expect(inserted).toMatchObject({
      workspaceId: workspaceA,
      kbId: knowledgeBaseId,
      chunkId,
      term: TEST_CHUNK_TERM,
      frequency: 1,
    });

    const updated = await testbed.tenants.run(workspaceA, () =>
      repository.update(workspaceA, chunkId, TEST_CHUNK_TERM, {
        frequency: TEST_CHUNK_TERM_FREQUENCY,
      }),
    );
    const seen = await testbed.tenants.run(workspaceB, async () => ({
      found: await repository.find(workspaceA, chunkId, TEST_CHUNK_TERM),
      updated: await repository.update(workspaceA, chunkId, TEST_CHUNK_TERM, {
        frequency: TEST_CHUNK_TERM_FREQUENCY,
      }),
      deleted: await repository.deleteById(workspaceA, chunkId, TEST_CHUNK_TERM),
    }));
    const deleted = await testbed.tenants.run(workspaceA, () =>
      repository.deleteById(workspaceA, chunkId, TEST_CHUNK_TERM),
    );
    const found = await testbed.tenants.run(workspaceA, () =>
      repository.find(workspaceA, chunkId, TEST_CHUNK_TERM),
    );

    expect(updated).toMatchObject({ frequency: TEST_CHUNK_TERM_FREQUENCY });
    expect(seen).toEqual({ found: null, updated: null, deleted: false });
    expect(deleted).toBe(true);
    expect(found).toBeNull();
  });
});
