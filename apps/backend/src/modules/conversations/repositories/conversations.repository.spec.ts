import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  createConversationsTestbed,
  seedConversation,
} from '@test/support/helpers/conversations-testing.helpers';
import type { ConversationsTestbed } from '@test/support/typedefs/conversations-testing.typedefs';

describe('ConversationsRepository', () => {
  let testbed: ConversationsTestbed;

  beforeAll(async () => {
    testbed = await createConversationsTestbed();
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('lets only one of two concurrent claims win', async () => {
    const { id, workspaceId } = await seedConversation(testbed);
    const runs = [testbed.ids.generate(), testbed.ids.generate()];

    const results = await Promise.all(
      runs.map((runId) =>
        testbed.tenants.run(workspaceId, () => testbed.conversations.claim(workspaceId, id, runId)),
      ),
    );

    const stored = await testbed.tenants.run(workspaceId, () =>
      testbed.conversations.findById(workspaceId, id),
    );
    expect(results.filter(Boolean)).toHaveLength(1);
    expect(stored?.activeRunId).toBe(runs[results.indexOf(true)]);
  });

  it('releases the claim only for the run that holds it', async () => {
    const { id, workspaceId } = await seedConversation(testbed);
    const holder = testbed.ids.generate();
    const other = testbed.ids.generate();

    const outcome = await testbed.tenants.run(workspaceId, async () => ({
      claimed: await testbed.conversations.claim(workspaceId, id, holder),
      releasedByOther: await testbed.conversations.release(workspaceId, id, other),
      releasedByHolder: await testbed.conversations.release(workspaceId, id, holder),
      claimedAgain: await testbed.conversations.claim(workspaceId, id, other),
    }));

    expect(outcome).toEqual({
      claimed: true,
      releasedByOther: false,
      releasedByHolder: true,
      claimedAgain: true,
    });
  });

  it('never shows or claims the conversation of another workspace', async () => {
    const { id, workspaceId } = await seedConversation(testbed);
    const otherWorkspaceId = testbed.ids.generate();

    const fromOther = await testbed.tenants.run(otherWorkspaceId, async () => ({
      found: await testbed.conversations.findById(workspaceId, id),
      claimed: await testbed.conversations.claim(workspaceId, id, testbed.ids.generate()),
    }));

    expect(fromOther).toEqual({ found: null, claimed: false });
  });

  it('shows nothing without a tenant', async () => {
    const { id, workspaceId } = await seedConversation(testbed);

    expect(await testbed.conversations.findById(workspaceId, id)).toBeNull();
  });
});
