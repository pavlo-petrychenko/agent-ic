import { IdPrefix } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ChannelStatus } from '@/modules/channels/constants/channel.constants';
import { ApiChannelIngressService } from '@/modules/channels/services/api-channel-ingress.service';
import { newChannel } from '@test/support/fixtures/channel.fixture';
import {
  createChannelsTestbed,
  seedApiChannel,
  seedChannelWorkspace,
} from '@test/support/helpers/channels-testing.helpers';
import type { ChannelsTestbed } from '@test/support/typedefs/channels-testing.typedefs';

const publicId = (testbed: ChannelsTestbed, channelId: string): string =>
  testbed.ids.toPublic(IdPrefix.Channel, channelId);

describe('ApiChannelIngressService', () => {
  let testbed: ChannelsTestbed;
  let service: ApiChannelIngressService;

  beforeAll(async () => {
    testbed = await createChannelsTestbed();
    service = testbed.module.get(ApiChannelIngressService);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('resolves an API channel by its public id, across workspaces', async () => {
    const first = await seedApiChannel(testbed);
    const second = await seedApiChannel(testbed);

    await expect(service.find(publicId(testbed, first.channel.id))).resolves.toMatchObject({
      id: first.channel.id,
      workspaceId: first.workspaceId,
      agentId: first.agentId,
      status: ChannelStatus.Connected,
      credentialsSealed: first.channel.credentialsSealed,
    });
    await expect(service.find(publicId(testbed, second.channel.id))).resolves.toMatchObject({
      id: second.channel.id,
      workspaceId: second.workspaceId,
    });
  });

  it('does not resolve a telegram channel', async () => {
    const workspace = await seedChannelWorkspace(testbed);
    const channel = newChannel(testbed, workspace.workspaceId, {
      createdByUserId: workspace.userId,
    });
    await testbed.tenants.run(workspace.workspaceId, () =>
      testbed.channels.insertIfAbsent(channel),
    );

    await expect(service.find(publicId(testbed, channel.id))).resolves.toBeNull();
  });

  it('returns null for an unknown channel id', async () => {
    const channelId = testbed.ids.generate();

    await expect(service.find(publicId(testbed, channelId))).resolves.toBeNull();
  });

  it('returns null for a malformed public id', async () => {
    await expect(service.find('not-a-channel-id')).resolves.toBeNull();
  });
});
