import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { KnowledgeConnectionStatus } from '@/modules/knowledge/constants/knowledge.constants';
import { ConnectionsRepository } from '@/modules/knowledge/repositories/connections.repository';
import { CLOCK_TICK_MS } from '@test/support/constants/manual-clock.constants';
import { newConnection } from '@test/support/fixtures/knowledge.fixture';
import { createKnowledgeTestbed } from '@test/support/helpers/knowledge-testing.helpers';
import { ensureWorkspaceRow } from '@test/support/helpers/parent-rows.helpers';
import type { KnowledgeTestbed } from '@test/support/typedefs/knowledge-testing.typedefs';

describe('ConnectionsRepository', () => {
  let testbed: KnowledgeTestbed;
  let repository: ConnectionsRepository;

  beforeAll(async () => {
    testbed = await createKnowledgeTestbed();
    repository = testbed.module.get(ConnectionsRepository);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('stores, updates, deletes and isolates a connection', async () => {
    const workspaceA = testbed.ids.generate();
    const workspaceB = testbed.ids.generate();
    await ensureWorkspaceRow(testbed.module, workspaceA);
    await ensureWorkspaceRow(testbed.module, workspaceB);

    const inserted = await testbed.tenants.run(workspaceA, () =>
      repository.insert(newConnection(testbed.ids.generate(), workspaceA)),
    );
    expect(inserted).toMatchObject({
      workspaceId: workspaceA,
      createdAt: testbed.clock.now(),
      updatedAt: testbed.clock.now(),
    });

    testbed.clock.advanceBy(CLOCK_TICK_MS);
    const updated = await testbed.tenants.run(workspaceA, () =>
      repository.update(workspaceA, inserted.id, {
        status: KnowledgeConnectionStatus.Revoked,
      }),
    );
    const seen = await testbed.tenants.run(workspaceB, async () => ({
      found: await repository.findById(workspaceA, inserted.id),
      updated: await repository.update(workspaceA, inserted.id, {
        status: KnowledgeConnectionStatus.Revoked,
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
      status: KnowledgeConnectionStatus.Revoked,
      updatedAt: testbed.clock.now(),
    });
    expect(seen).toEqual({ found: null, updated: null, deleted: false });
    expect(deleted).toBe(true);
    expect(found).toBeNull();
  });
});
