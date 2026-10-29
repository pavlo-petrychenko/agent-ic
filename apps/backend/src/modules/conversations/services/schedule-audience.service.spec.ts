import { ChannelKind } from '@agent-ic/contracts';
import { ChannelType, NodeType, ScheduleKind } from '@agent-ic/flow';
import type { TriggerScheduleNode } from '@agent-ic/flow';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  ConversationMode,
  ConversationState,
} from '@/modules/conversations/constants/conversation.constants';
import { ScheduleAudienceService } from '@/modules/conversations/services/schedule-audience.service';
import type { NewConversation } from '@/modules/conversations/typedefs/conversation.typedefs';
import {
  MILLISECONDS_PER_SECOND,
  SECONDS_PER_HOUR,
} from '@/platform/clock/constants/time.constants';
import { CONVERSATIONS_TEST_START } from '@test/support/constants/conversations-testing.constants';
import { newConversation } from '@test/support/fixtures/conversation.fixture';
import { createConversationsTestbed } from '@test/support/helpers/conversations-testing.helpers';
import { ensureAgentRow, seedRunRow } from '@test/support/helpers/parent-rows.helpers';
import type { ConversationsTestbed } from '@test/support/typedefs/conversations-testing.typedefs';

const hoursBefore = (date: Date, hours: number) =>
  new Date(date.getTime() - hours * SECONDS_PER_HOUR * MILLISECONDS_PER_SECOND);

const tick = new Date(
  CONVERSATIONS_TEST_START.getTime() + 48 * SECONDS_PER_HOUR * MILLISECONDS_PER_SECOND,
);
const nextTick = new Date(tick.getTime() + 24 * SECONDS_PER_HOUR * MILLISECONDS_PER_SECOND);

const scheduleNode = (
  config: Partial<TriggerScheduleNode['config']> = {},
): TriggerScheduleNode => ({
  id: 'node-follow-up',
  key: 'follow_up',
  label: 'Follow up',
  position: { x: 0, y: 0 },
  type: NodeType.TriggerSchedule,
  config: {
    schedule: { kind: ScheduleKind.Daily, time: '10:00', timeZone: 'UTC' },
    conditions: {
      silentForHours: 24,
      notEscalated: true,
      channelTypes: [ChannelType.Telegram, ChannelType.Api],
    },
    maxConversationsPerRun: 10,
    oncePerConversation: false,
    ...config,
  },
});

describe('ScheduleAudienceService', () => {
  let testbed: ConversationsTestbed;
  let audience: ScheduleAudienceService;

  beforeAll(async () => {
    testbed = await createConversationsTestbed();
    audience = testbed.module.get(ScheduleAudienceService);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  const seedAgentWorkspace = async () => {
    const workspaceId = testbed.ids.generate();
    const agentId = testbed.ids.generate();
    await ensureAgentRow(testbed.module, workspaceId, agentId);
    return { workspaceId, agentId };
  };

  const seed = async (
    owner: { workspaceId: string; agentId: string },
    overrides: Partial<NewConversation> = {},
  ): Promise<NewConversation> => {
    const conversation: NewConversation = {
      ...newConversation(testbed, owner.workspaceId),
      agentId: owner.agentId,
      channelKind: ChannelKind.Telegram,
      lastCustomerMessageAt: hoursBefore(tick, 30),
      ...overrides,
    };
    await testbed.tenants.run(owner.workspaceId, () => testbed.conversations.insert(conversation));
    return conversation;
  };

  const candidates = (
    owner: { workspaceId: string; agentId: string },
    node: TriggerScheduleNode = scheduleNode(),
    at: Date = tick,
  ) =>
    testbed.tenants
      .run(owner.workspaceId, () =>
        audience.findCandidates(owner.workspaceId, { agentId: owner.agentId, node, tick: at }),
      )
      .then((found) => found.map((conversation) => conversation.id));

  const contact = (
    owner: { workspaceId: string; agentId: string },
    conversationId: string,
    node: TriggerScheduleNode = scheduleNode(),
    at: Date = tick,
  ) =>
    testbed.tenants.run(owner.workspaceId, () =>
      audience.recordContact(owner.workspaceId, {
        agentId: owner.agentId,
        node,
        tick: at,
        conversationId,
      }),
    );

  it('picks silent, never escalated live chats, oldest silence first, up to the limit', async () => {
    const owner = await seedAgentWorkspace();
    const older = await seed(owner, { lastCustomerMessageAt: hoursBefore(tick, 40) });
    const newer = await seed(owner, { channelKind: ChannelKind.Api });
    const oldest = await seed(owner, { lastCustomerMessageAt: hoursBefore(tick, 50) });

    expect(await candidates(owner)).toEqual([oldest.id, older.id, newer.id]);
    expect(await candidates(owner, scheduleNode({ maxConversationsPerRun: 2 }))).toEqual([
      oldest.id,
      older.id,
    ]);
  });

  it('leaves out chats that do not match the conditions', async () => {
    const owner = await seedAgentWorkspace();
    const match = await seed(owner);
    await seed(owner, { lastCustomerMessageAt: hoursBefore(tick, 2) });
    await seed(owner, { lastCustomerMessageAt: null });
    await seed(owner, { lastEscalatedAt: hoursBefore(tick, 40) });
    await seed(owner, { state: ConversationState.Waiting });
    await seed(owner, { state: ConversationState.Closed });
    await seed(owner, { mode: ConversationMode.Simulation });
    await seed(owner, { channelKind: ChannelKind.Simulated });
    const busy = await seed(owner);
    const runId = await seedRunRow(testbed.module, busy);
    await testbed.tenants.run(owner.workspaceId, () =>
      testbed.conversations.claim(owner.workspaceId, busy.id, runId),
    );

    expect(await candidates(owner)).toEqual([match.id]);
  });

  it('applies only the conditions the trigger turns on', async () => {
    const owner = await seedAgentWorkspace();
    const recent = await seed(owner, { lastCustomerMessageAt: hoursBefore(tick, 1) });
    const escalated = await seed(owner, { lastEscalatedAt: hoursBefore(tick, 40) });
    const loose = scheduleNode({
      conditions: {
        silentForHours: null,
        notEscalated: false,
        channelTypes: [ChannelType.Telegram],
      },
    });

    expect(await candidates(owner, loose)).toEqual(
      expect.arrayContaining([recent.id, escalated.id]),
    );
  });

  it('contacts a chat once per silence until the customer writes again', async () => {
    const owner = await seedAgentWorkspace();
    const silent = await seed(owner);
    const answered = await seed(owner, { lastCustomerMessageAt: hoursBefore(nextTick, 25) });

    expect(await contact(owner, silent.id)).toBe(true);
    expect(await contact(owner, silent.id)).toBe(false);
    expect(await contact(owner, answered.id, scheduleNode(), hoursBefore(nextTick, 30))).toBe(true);

    expect(await candidates(owner, scheduleNode(), tick)).toEqual([]);
    expect(await candidates(owner, scheduleNode(), nextTick)).toEqual([answered.id]);
  });

  it('contacts a chat only once when the trigger says once per conversation', async () => {
    const owner = await seedAgentWorkspace();
    const once = scheduleNode({ oncePerConversation: true });
    const chat = await seed(owner, { lastCustomerMessageAt: hoursBefore(nextTick, 25) });

    expect(await contact(owner, chat.id, once, hoursBefore(nextTick, 30))).toBe(true);
    expect(await contact(owner, chat.id, once, nextTick)).toBe(false);
    expect(await candidates(owner, once, nextTick)).toEqual([]);
  });

  it('never shows the chats of another workspace', async () => {
    const owner = await seedAgentWorkspace();
    await seed(owner);
    const other = { workspaceId: testbed.ids.generate(), agentId: owner.agentId };

    const fromOther = await testbed.tenants.run(other.workspaceId, () =>
      audience.findCandidates(owner.workspaceId, {
        agentId: owner.agentId,
        node: scheduleNode(),
        tick,
      }),
    );

    expect(fromOther).toEqual([]);
  });
});
