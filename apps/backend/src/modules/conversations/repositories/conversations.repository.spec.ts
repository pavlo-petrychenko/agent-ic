import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ConversationState } from '@/modules/conversations';
import {
  createConversationsTestbed,
  seedConversation,
} from '@test/support/helpers/conversations-testing.helpers';
import { seedRunRow } from '@test/support/helpers/parent-rows.helpers';
import type { ConversationsTestbed } from '@test/support/typedefs/conversations-testing.typedefs';

describe('ConversationsRepository', () => {
  let testbed: ConversationsTestbed;

  beforeAll(async () => {
    testbed = await createConversationsTestbed();
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('pages the live list by last message time and id', async () => {
    const first = await seedConversation(testbed);
    testbed.clock.advanceBy(1000);
    const second = await seedConversation(testbed, first.workspaceId);
    testbed.clock.advanceBy(1000);
    const third = await seedConversation(testbed, first.workspaceId);

    const page = await testbed.tenants.run(first.workspaceId, () =>
      testbed.conversations.listLive(first.workspaceId, [ConversationState.AgentActive], 2, null),
    );
    expect(page.map((conversation) => conversation.id)).toEqual([third.id, second.id]);

    const cursor = page[1];
    const next = await testbed.tenants.run(first.workspaceId, () =>
      testbed.conversations.listLive(
        first.workspaceId,
        [ConversationState.AgentActive],
        2,
        cursor ?? null,
      ),
    );
    expect(next.map((conversation) => conversation.id)).toEqual([first.id]);
  });

  it('lists only the conversations of the requested queue and counts every state', async () => {
    const waiting = await seedConversation(testbed);
    testbed.clock.advanceBy(1000);
    const active = await seedConversation(testbed, waiting.workspaceId);
    testbed.clock.advanceBy(1000);
    const closed = await seedConversation(testbed, waiting.workspaceId);
    await testbed.tenants.run(waiting.workspaceId, async () => {
      await testbed.conversations.markWaiting(waiting.workspaceId, waiting.id);
      await testbed.conversations.close(waiting.workspaceId, closed.id, testbed.clock.now(), null);
    });

    const outcome = await testbed.tenants.run(waiting.workspaceId, async () => ({
      needsYou: await testbed.conversations.listLive(
        waiting.workspaceId,
        [ConversationState.Waiting, ConversationState.Handled],
        10,
        null,
      ),
      live: await testbed.conversations.listLive(
        waiting.workspaceId,
        [ConversationState.AgentActive],
        10,
        null,
      ),
      counts: await testbed.conversations.countByState(waiting.workspaceId),
    }));

    expect(outcome.needsYou.map((conversation) => conversation.id)).toEqual([waiting.id]);
    expect(outcome.live.map((conversation) => conversation.id)).toEqual([active.id]);
    expect(new Map(outcome.counts.map((row) => [row.state, row.total]))).toEqual(
      new Map([
        [ConversationState.Waiting, 1],
        [ConversationState.AgentActive, 1],
        [ConversationState.Closed, 1],
      ]),
    );
  });

  it('lets only one of two concurrent claims win', async () => {
    const conversation = await seedConversation(testbed);
    const { id, workspaceId } = conversation;
    const runs = [
      await seedRunRow(testbed.module, conversation),
      await seedRunRow(testbed.module, conversation),
    ];

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
    const conversation = await seedConversation(testbed);
    const { id, workspaceId } = conversation;
    const holder = await seedRunRow(testbed.module, conversation);
    const other = await seedRunRow(testbed.module, conversation);

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
    const conversation = await seedConversation(testbed);
    const { id, workspaceId } = conversation;
    const runId = await seedRunRow(testbed.module, conversation);
    const otherWorkspaceId = testbed.ids.generate();

    const fromOther = await testbed.tenants.run(otherWorkspaceId, async () => ({
      found: await testbed.conversations.findById(workspaceId, id),
      locked: await testbed.conversations.lockIdle(workspaceId, id),
      claimed: await testbed.conversations.claim(workspaceId, id, runId),
    }));

    expect(fromOther).toEqual({ found: null, locked: false, claimed: false });
  });

  it('locks a conversation only while it has no active run', async () => {
    const conversation = await seedConversation(testbed);
    const { id, workspaceId } = conversation;
    const runId = await seedRunRow(testbed.module, conversation);

    const outcome = await testbed.tenants.run(workspaceId, async () => ({
      idle: await testbed.conversations.lockIdle(workspaceId, id),
      claimed: await testbed.conversations.claim(workspaceId, id, runId),
      busy: await testbed.conversations.lockIdle(workspaceId, id),
    }));

    expect(outcome).toEqual({ idle: true, claimed: true, busy: false });
  });

  it('shows nothing without a tenant', async () => {
    const { id, workspaceId } = await seedConversation(testbed);

    expect(await testbed.conversations.findById(workspaceId, id)).toBeNull();
  });
});
