import { IdPrefix } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ApiChannelReplyStatus } from '@/modules/channels/constants/channel.constants';
import { ApiChannelReplyService } from '@/modules/channels/services/api-channel-reply.service';
import { ChannelKind, MessageAuthor } from '@/modules/conversations';
import { RunStatus } from '@/modules/runs';
import {
  AGENT_REPLY_TEXT,
  MESSAGE_SPACING_MS,
  QUICK_REPLIES,
  TEST_END_USER_EXTERNAL_ID,
} from '@test/support/constants/conversations-testing.constants';
import { workspaceSystemCtx } from '@test/support/fixtures/conversation.fixture';
import {
  createChannelsTestbed,
  seedApiChannel,
  seedChannelConversation,
} from '@test/support/helpers/channels-testing.helpers';
import { seedRunRow } from '@test/support/helpers/parent-rows.helpers';
import { finishRun } from '@test/support/helpers/runs-testing.helpers';
import type { ChannelsTestbed } from '@test/support/typedefs/channels-testing.typedefs';

describe('ApiChannelReplyService', () => {
  let testbed: ChannelsTestbed;
  let replies: ApiChannelReplyService;

  beforeAll(async () => {
    testbed = await createChannelsTestbed();
    replies = testbed.module.get(ApiChannelReplyService);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  const seed = async () => {
    const seeded = await seedApiChannel(testbed);
    const conversation = await seedChannelConversation(testbed, {
      workspaceId: seeded.workspaceId,
      agentId: seeded.agentId,
      channelKind: ChannelKind.Api,
      channelId: seeded.channel.id,
      endUserExternalId: TEST_END_USER_EXTERNAL_ID,
    });
    return { ...seeded, conversation };
  };

  const recordAgentReply = async (seeded: Awaited<ReturnType<typeof seed>>, runId: string) => {
    testbed.clock.advanceBy(MESSAGE_SPACING_MS);
    return testbed.tenants.run(seeded.workspaceId, () =>
      testbed.runs.recordOutbound(workspaceSystemCtx(seeded.workspaceId), {
        workspaceId: seeded.workspaceId,
        conversationId: seeded.conversation.id,
        key: testbed.ids.generate(),
        author: MessageAuthor.Agent,
        text: AGENT_REPLY_TEXT,
        quickReplies: QUICK_REPLIES,
        runId,
      }),
    );
  };

  const start = (seeded: Awaited<ReturnType<typeof seed>>) => () =>
    Promise.resolve({
      conversationId: testbed.ids.toPublic(IdPrefix.Conversation, seeded.conversation.id),
      runStarted: true,
    });

  it('returns the agent reply as answered', async () => {
    const seeded = await seed();
    const runId = await seedRunRow(testbed.module, seeded.conversation);
    const agent = await recordAgentReply(seeded, runId);
    await finishRun(testbed, seeded.workspaceId, runId, RunStatus.Succeeded);

    const result = await replies.wait(seeded.workspaceId, runId, start(seeded));

    expect(result.reply).toEqual({
      status: ApiChannelReplyStatus.Answered,
      messages: [
        {
          id: testbed.ids.toPublic(IdPrefix.Message, agent.id),
          text: agent.text,
          quick_replies: agent.quickReplies,
        },
      ],
    });
  });

  it('returns escalated when the run escalated', async () => {
    const seeded = await seed();
    const runId = await seedRunRow(testbed.module, seeded.conversation);
    await recordAgentReply(seeded, runId);
    await finishRun(testbed, seeded.workspaceId, runId, RunStatus.Escalated);

    const result = await replies.wait(seeded.workspaceId, runId, start(seeded));

    expect(result.reply.status).toBe(ApiChannelReplyStatus.Escalated);
  });

  it('returns pending and no messages while the run is unfinished', async () => {
    const seeded = await seed();
    const runId = await seedRunRow(testbed.module, seeded.conversation);

    const result = await replies.wait(seeded.workspaceId, runId, start(seeded));

    expect(result.reply).toEqual({ status: ApiChannelReplyStatus.Pending, messages: [] });
  });
});
