import { ChannelKind, IdPrefix, WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ChannelStatus } from '@/modules/channels/constants/channel.constants';
import { UpdateTelegramChannelUseCase } from '@/modules/channels/use-cases/update-telegram.use-case';
import { TEST_WORKSPACE_OWNER_NAME } from '@test/support/constants/workspace-testing.constants';
import { newChannel } from '@test/support/fixtures/channel.fixture';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import {
  createChannelsTestbed,
  seedChannelWorkspace,
} from '@test/support/helpers/channels-testing.helpers';
import { seedAgent } from '@test/support/helpers/conversations-testing.helpers';
import type { ChannelsTestbed } from '@test/support/typedefs/channels-testing.typedefs';

describe('UpdateTelegramChannelUseCase', () => {
  let testbed: ChannelsTestbed;
  let updateTelegram: UpdateTelegramChannelUseCase;

  beforeAll(async () => {
    testbed = await createChannelsTestbed();
    updateTelegram = testbed.module.get(UpdateTelegramChannelUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('updates the agent and typing setting and records the actor', async () => {
    const { workspaceId, userId } = await seedChannelWorkspace(testbed);
    const agentId = await seedAgent(testbed, workspaceId);
    const nextAgentId = await seedAgent(testbed, workspaceId);
    const channel = newChannel(testbed, workspaceId, {
      createdByUserId: userId,
      status: ChannelStatus.Connected,
      agentId,
    });
    await testbed.tenants.run(workspaceId, () => testbed.channels.insertIfAbsent(channel));

    const view = await updateTelegram.execute(
      workspaceCtx(userId, workspaceId, WorkspaceRole.Owner),
      {
        id: testbed.ids.toPublic(IdPrefix.Channel, channel.id),
        agentId: testbed.ids.toPublic(IdPrefix.Agent, nextAgentId),
        showTyping: false,
      },
    );

    expect(view).toMatchObject({
      kind: ChannelKind.Telegram,
      status: ChannelStatus.Connected,
      agentId: testbed.ids.toPublic(IdPrefix.Agent, nextAgentId),
      showTyping: false,
      updatedByName: TEST_WORKSPACE_OWNER_NAME,
    });
    const stored = await testbed.tenants.run(workspaceId, () =>
      testbed.channels.findById(workspaceId, channel.id),
    );
    expect(stored?.agentId).toBe(nextAgentId);
    expect(stored?.updatedByUserId).toBe(userId);
  });
});
