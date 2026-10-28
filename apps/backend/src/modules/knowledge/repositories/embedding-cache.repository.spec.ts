import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { KNOWLEDGE_EMBEDDING_DIMENSIONS } from '@/modules/knowledge/constants/knowledge.constants';
import { EmbeddingCacheRepository } from '@/modules/knowledge/repositories/embedding-cache.repository';
import {
  TEST_EMBEDDING_MODEL,
  TEST_EMBEDDING_TEXT_HASH,
  TEST_EMBEDDING_VECTOR_UPDATED,
} from '@test/support/constants/knowledge-testing.constants';
import { CLOCK_TICK_MS } from '@test/support/constants/manual-clock.constants';
import { newEmbeddingCacheEntry } from '@test/support/fixtures/knowledge.fixture';
import { createKnowledgeTestbed } from '@test/support/helpers/knowledge-testing.helpers';
import { ensureWorkspaceRow } from '@test/support/helpers/parent-rows.helpers';
import type { KnowledgeTestbed } from '@test/support/typedefs/knowledge-testing.typedefs';

describe('EmbeddingCacheRepository', () => {
  let testbed: KnowledgeTestbed;
  let repository: EmbeddingCacheRepository;

  beforeAll(async () => {
    testbed = await createKnowledgeTestbed();
    repository = testbed.module.get(EmbeddingCacheRepository);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  const find = (workspaceId: string) =>
    repository.find(
      workspaceId,
      TEST_EMBEDDING_MODEL,
      KNOWLEDGE_EMBEDDING_DIMENSIONS,
      TEST_EMBEDDING_TEXT_HASH,
    );

  const update = (workspaceId: string) =>
    repository.update(
      workspaceId,
      TEST_EMBEDDING_MODEL,
      KNOWLEDGE_EMBEDDING_DIMENSIONS,
      TEST_EMBEDDING_TEXT_HASH,
      { embedding: TEST_EMBEDDING_VECTOR_UPDATED },
    );

  const remove = (workspaceId: string) =>
    repository.deleteById(
      workspaceId,
      TEST_EMBEDDING_MODEL,
      KNOWLEDGE_EMBEDDING_DIMENSIONS,
      TEST_EMBEDDING_TEXT_HASH,
    );

  it('stores, updates, deletes and isolates an embedding cache entry', async () => {
    const workspaceA = testbed.ids.generate();
    const workspaceB = testbed.ids.generate();
    await ensureWorkspaceRow(testbed.module, workspaceA);
    await ensureWorkspaceRow(testbed.module, workspaceB);

    const inserted = await testbed.tenants.run(workspaceA, () =>
      repository.insert(newEmbeddingCacheEntry(workspaceA)),
    );
    expect(inserted).toMatchObject({
      workspaceId: workspaceA,
      model: TEST_EMBEDDING_MODEL,
      dimensions: KNOWLEDGE_EMBEDDING_DIMENSIONS,
      textHash: TEST_EMBEDDING_TEXT_HASH,
      createdAt: testbed.clock.now(),
      lastUsedAt: testbed.clock.now(),
    });

    testbed.clock.advanceBy(CLOCK_TICK_MS);
    const updated = await testbed.tenants.run(workspaceA, () => update(workspaceA));
    const seen = await testbed.tenants.run(workspaceB, async () => ({
      found: await find(workspaceA),
      updated: await update(workspaceA),
      deleted: await remove(workspaceA),
    }));
    const deleted = await testbed.tenants.run(workspaceA, () => remove(workspaceA));
    const found = await testbed.tenants.run(workspaceA, () => find(workspaceA));

    expect(updated).toMatchObject({ lastUsedAt: testbed.clock.now() });
    expect(seen).toEqual({ found: null, updated: null, deleted: false });
    expect(deleted).toBe(true);
    expect(found).toBeNull();
  });
});
