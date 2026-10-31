import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ChannelStatus } from '@/modules/channels/constants/channel.constants';
import { ChannelHealthService } from '@/modules/channels/services/channel-health.service';
import { newChannel } from '@test/support/fixtures/channel.fixture';
import {
  createChannelsTestbed,
  seedChannelWorkspace,
} from '@test/support/helpers/channels-testing.helpers';
import type { ChannelsTestbed } from '@test/support/typedefs/channels-testing.typedefs';

describe('ChannelHealthService', () => {
  let testbed: ChannelsTestbed;
  let health: ChannelHealthService;

  beforeAll(async () => {
    testbed = await createChannelsTestbed();
    health = testbed.module.get(ChannelHealthService);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  const seed = async (status: ChannelStatus) => {
    const workspace = await seedChannelWorkspace(testbed);
    const channel = newChannel(testbed, workspace.workspaceId, {
      createdByUserId: workspace.userId,
      status,
      externalId: testbed.ids.generate(),
    });
    await testbed.tenants.run(workspace.workspaceId, () =>
      testbed.channels.insertIfAbsent(channel),
    );
    return { ...workspace, channel };
  };

  const stored = (workspaceId: string, channelId: string) =>
    testbed.tenants.run(workspaceId, () => testbed.channels.findById(workspaceId, channelId));

  it('marks a connected channel as broken and clears the actor', async () => {
    const { workspaceId, channel } = await seed(ChannelStatus.Connected);

    await expect(health.markBroken(workspaceId, channel.id)).resolves.toBe(true);

    await expect(stored(workspaceId, channel.id)).resolves.toMatchObject({
      status: ChannelStatus.Broken,
      updatedAt: testbed.clock.now(),
      updatedByUserId: null,
    });
  });

  it('does nothing for a channel that is not connected', async () => {
    const { workspaceId, channel } = await seed(ChannelStatus.Disconnected);

    await expect(health.markBroken(workspaceId, channel.id)).resolves.toBe(false);

    await expect(stored(workspaceId, channel.id)).resolves.toMatchObject({
      status: ChannelStatus.Disconnected,
    });
  });

  it('does nothing for a channel that is already broken', async () => {
    const { workspaceId, channel } = await seed(ChannelStatus.Broken);

    await expect(health.markBroken(workspaceId, channel.id)).resolves.toBe(false);
  });

  it('does not touch the channel of another workspace', async () => {
    const first = await seed(ChannelStatus.Connected);
    const second = await seed(ChannelStatus.Connected);

    await expect(health.markBroken(first.workspaceId, second.channel.id)).resolves.toBe(false);

    await expect(stored(second.workspaceId, second.channel.id)).resolves.toMatchObject({
      status: ChannelStatus.Connected,
    });
  });
});
