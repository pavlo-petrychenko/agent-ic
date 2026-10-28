import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { KnowledgeSyncStatus } from '@/modules/knowledge/constants/knowledge.constants';
import { SyncRunsRepository } from '@/modules/knowledge/repositories/sync-runs.repository';
import { KNOWLEDGE_TEST_LATER } from '@test/support/constants/knowledge-testing.constants';
import { CLOCK_TICK_MS } from '@test/support/constants/manual-clock.constants';
import { newSyncRun } from '@test/support/fixtures/knowledge.fixture';
import {
  createKnowledgeTestbed,
  seedKnowledgeBase,
  seedKnowledgeSource,
} from '@test/support/helpers/knowledge-testing.helpers';
import { ensureWorkspaceRow } from '@test/support/helpers/parent-rows.helpers';
import type { KnowledgeTestbed } from '@test/support/typedefs/knowledge-testing.typedefs';

describe('SyncRunsRepository', () => {
  let testbed: KnowledgeTestbed;
  let repository: SyncRunsRepository;

  beforeAll(async () => {
    testbed = await createKnowledgeTestbed();
    repository = testbed.module.get(SyncRunsRepository);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('stores, updates, deletes and isolates a sync run', async () => {
    const workspaceA = testbed.ids.generate();
    const workspaceB = testbed.ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceA);
    const sourceId = await seedKnowledgeSource(testbed, workspaceA, knowledgeBaseId);
    await ensureWorkspaceRow(testbed.module, workspaceB);

    const inserted = await testbed.tenants.run(workspaceA, () =>
      repository.insert(newSyncRun(testbed.ids.generate(), workspaceA, sourceId)),
    );
    expect(inserted).toMatchObject({
      workspaceId: workspaceA,
      sourceId,
      status: KnowledgeSyncStatus.Queued,
      createdAt: testbed.clock.now(),
    });

    testbed.clock.advanceBy(CLOCK_TICK_MS);
    const updated = await testbed.tenants.run(workspaceA, () =>
      repository.update(workspaceA, inserted.id, {
        status: KnowledgeSyncStatus.Succeeded,
        finishedAt: KNOWLEDGE_TEST_LATER,
      }),
    );
    const seen = await testbed.tenants.run(workspaceB, async () => ({
      found: await repository.findById(workspaceA, inserted.id),
      updated: await repository.update(workspaceA, inserted.id, {
        status: KnowledgeSyncStatus.Succeeded,
        finishedAt: KNOWLEDGE_TEST_LATER,
      }),
      deleted: await repository.deleteById(workspaceA, inserted.id),
    }));
    const deleted = await testbed.tenants.run(workspaceA, () =>
      repository.deleteById(workspaceA, inserted.id),
    );
    const found = await testbed.tenants.run(workspaceA, () =>
      repository.findById(workspaceA, inserted.id),
    );

    expect(updated).toMatchObject({
      status: KnowledgeSyncStatus.Succeeded,
      finishedAt: KNOWLEDGE_TEST_LATER,
    });
    expect(seen).toEqual({ found: null, updated: null, deleted: false });
    expect(deleted).toBe(true);
    expect(found).toBeNull();
  });
});
