import { ChannelKind, IdPrefix, WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ChannelStatus } from '@/modules/channels/constants/channel.constants';
import { ChannelNotFoundError } from '@/modules/channels/errors/channel-not-found.error';
import { GetChannelUseCase } from '@/modules/channels/use-cases/get-channel.use-case';
import { TEST_TELEGRAM_BOT_USERNAME } from '@test/support/constants/channel-testing.constants';
import { newChannel } from '@test/support/fixtures/channel.fixture';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import {
  createChannelsTestbed,
  seedChannelWorkspace,
} from '@test/support/helpers/channels-testing.helpers';
import type { ChannelsTestbed } from '@test/support/typedefs/channels-testing.typedefs';

describe('GetChannelUseCase', () => {
  let testbed: ChannelsTestbed;
  let getChannel: GetChannelUseCase;

  beforeAll(async () => {
    testbed = await createChannelsTestbed();
    getChannel = testbed.module.get(GetChannelUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('returns a channel from the workspace', async () => {
    const { workspaceId, userId } = await seedChannelWorkspace(testbed);
    const channel = newChannel(testbed, workspaceId, {
      createdByUserId: userId,
      status: ChannelStatus.Connected,
    });
    await testbed.tenants.run(workspaceId, () => testbed.channels.insertIfAbsent(channel));

    const view = await getChannel.execute(workspaceCtx(userId, workspaceId, WorkspaceRole.Owner), {
      id: testbed.ids.toPublic(IdPrefix.Channel, channel.id),
    });

    expect(view).toMatchObject({
      id: testbed.ids.toPublic(IdPrefix.Channel, channel.id),
      kind: ChannelKind.Telegram,
      status: ChannelStatus.Connected,
      agentId: null,
      displayName: TEST_TELEGRAM_BOT_USERNAME,
      tokenMasked: '7000•••••:dem•••••••••••••',
      showTyping: true,
    });
  });

  it('never returns a channel from another workspace', async () => {
    const workspaceA = await seedChannelWorkspace(testbed);
    const workspaceB = await seedChannelWorkspace(testbed);
    const channel = newChannel(testbed, workspaceB.workspaceId, {
      createdByUserId: workspaceB.userId,
    });
    await testbed.tenants.run(workspaceB.workspaceId, () =>
      testbed.channels.insertIfAbsent(channel),
    );

    await expect(
      getChannel.execute(
        workspaceCtx(workspaceA.userId, workspaceA.workspaceId, WorkspaceRole.Owner),
        {
          id: testbed.ids.toPublic(IdPrefix.Channel, channel.id),
        },
      ),
    ).rejects.toBeInstanceOf(ChannelNotFoundError);
  });
});
