import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { KnowledgeBasesRepository } from '@/modules/knowledge/repositories/knowledge-bases.repository';
import {
  KNOWLEDGE_TEST_LATER,
  TEST_KB_NAME,
  TEST_KB_NEW_NAME,
} from '@test/support/constants/knowledge-testing.constants';
import { CLOCK_TICK_MS } from '@test/support/constants/manual-clock.constants';
import { newKnowledgeBase } from '@test/support/fixtures/knowledge.fixture';
import { createKnowledgeTestbed } from '@test/support/helpers/knowledge-testing.helpers';
import { ensureWorkspaceRow } from '@test/support/helpers/parent-rows.helpers';
import type { KnowledgeTestbed } from '@test/support/typedefs/knowledge-testing.typedefs';

describe('KnowledgeBasesRepository', () => {
  let testbed: KnowledgeTestbed;
  let repository: KnowledgeBasesRepository;

  beforeAll(async () => {
    testbed = await createKnowledgeTestbed();
    repository = testbed.module.get(KnowledgeBasesRepository);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('stores, updates, soft deletes and isolates a knowledge base', async () => {
    const workspaceA = testbed.ids.generate();
    const workspaceB = testbed.ids.generate();
    await ensureWorkspaceRow(testbed.module, workspaceA);
    await ensureWorkspaceRow(testbed.module, workspaceB);

    const inserted = await testbed.tenants.run(workspaceA, () =>
      repository.insert(newKnowledgeBase(testbed.ids.generate(), workspaceA)),
    );
    expect(inserted).toMatchObject({
      workspaceId: workspaceA,
      name: TEST_KB_NAME,
      createdAt: testbed.clock.now(),
      updatedAt: testbed.clock.now(),
    });

    testbed.clock.advanceBy(CLOCK_TICK_MS);
    const updated = await testbed.tenants.run(workspaceA, () =>
      repository.update(workspaceA, inserted.id, { name: TEST_KB_NEW_NAME }),
    );
    const seen = await testbed.tenants.run(workspaceB, async () => ({
      found: await repository.findById(workspaceA, inserted.id),
      updated: await repository.update(workspaceA, inserted.id, { name: TEST_KB_NEW_NAME }),
      deleted: await repository.softDelete(workspaceA, inserted.id, KNOWLEDGE_TEST_LATER),
    }));
    const deleted = await testbed.tenants.run(workspaceA, () =>
      repository.softDelete(workspaceA, inserted.id, KNOWLEDGE_TEST_LATER),
    );
    const found = await testbed.tenants.run(workspaceA, () =>
      repository.findById(workspaceA, inserted.id),
    );

    expect(updated).toMatchObject({ name: TEST_KB_NEW_NAME, updatedAt: testbed.clock.now() });
    expect(seen).toEqual({ found: null, updated: null, deleted: false });
    expect(deleted).toBe(true);
    expect(found).toBeNull();
  });
});
