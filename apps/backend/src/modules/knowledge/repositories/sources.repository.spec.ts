import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SourcesRepository } from '@/modules/knowledge/repositories/sources.repository';
import {
  KNOWLEDGE_TEST_LATER,
  TEST_SOURCE_NEW_TITLE,
  TEST_SOURCE_TITLE,
} from '@test/support/constants/knowledge-testing.constants';
import { CLOCK_TICK_MS } from '@test/support/constants/manual-clock.constants';
import { newSource } from '@test/support/fixtures/knowledge.fixture';
import {
  createKnowledgeTestbed,
  seedKnowledgeBase,
} from '@test/support/helpers/knowledge-testing.helpers';
import { ensureWorkspaceRow } from '@test/support/helpers/parent-rows.helpers';
import type { KnowledgeTestbed } from '@test/support/typedefs/knowledge-testing.typedefs';

describe('SourcesRepository', () => {
  let testbed: KnowledgeTestbed;
  let repository: SourcesRepository;

  beforeAll(async () => {
    testbed = await createKnowledgeTestbed();
    repository = testbed.module.get(SourcesRepository);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('stores, updates, soft deletes and isolates a source', async () => {
    const workspaceA = testbed.ids.generate();
    const workspaceB = testbed.ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceA);
    await ensureWorkspaceRow(testbed.module, workspaceB);

    const inserted = await testbed.tenants.run(workspaceA, () =>
      repository.insert(newSource(testbed.ids.generate(), workspaceA, knowledgeBaseId)),
    );
    expect(inserted).toMatchObject({
      workspaceId: workspaceA,
      kbId: knowledgeBaseId,
      title: TEST_SOURCE_TITLE,
      createdAt: testbed.clock.now(),
      updatedAt: testbed.clock.now(),
    });

    testbed.clock.advanceBy(CLOCK_TICK_MS);
    const updated = await testbed.tenants.run(workspaceA, () =>
      repository.update(workspaceA, inserted.id, { title: TEST_SOURCE_NEW_TITLE }),
    );
    const seen = await testbed.tenants.run(workspaceB, async () => ({
      found: await repository.findById(workspaceA, inserted.id),
      updated: await repository.update(workspaceA, inserted.id, {
        title: TEST_SOURCE_NEW_TITLE,
      }),
      deleted: await repository.softDelete(workspaceA, inserted.id, KNOWLEDGE_TEST_LATER),
    }));
    const deleted = await testbed.tenants.run(workspaceA, () =>
      repository.softDelete(workspaceA, inserted.id, KNOWLEDGE_TEST_LATER),
    );
    const found = await testbed.tenants.run(workspaceA, () =>
      repository.findById(workspaceA, inserted.id),
    );

    expect(updated).toMatchObject({
      title: TEST_SOURCE_NEW_TITLE,
      updatedAt: testbed.clock.now(),
    });
    expect(seen).toEqual({ found: null, updated: null, deleted: false });
    expect(deleted).toBe(true);
    expect(found).toBeNull();
  });
});
