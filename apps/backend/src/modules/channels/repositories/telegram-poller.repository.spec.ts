import { ChannelKind } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ApiReplyMode, ChannelStatus } from '@/modules/channels/constants/channel.constants';
import { TelegramPollerRepository } from '@/modules/channels/repositories/telegram-poller.repository';
import type { NewChannel } from '@/modules/channels/typedefs/channel.typedefs';
import { newChannel } from '@test/support/fixtures/channel.fixture';
import {
  createChannelsTestbed,
  seedChannelWorkspace,
} from '@test/support/helpers/channels-testing.helpers';
import type { ChannelsTestbed } from '@test/support/typedefs/channels-testing.typedefs';

describe('TelegramPollerRepository', () => {
  let testbed: ChannelsTestbed;
  let pollerChannels: TelegramPollerRepository;

  beforeAll(async () => {
    testbed = await createChannelsTestbed();
    pollerChannels = testbed.module.get(TelegramPollerRepository);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  const seed = async (overrides: Partial<NewChannel> = {}) => {
    const workspace = await seedChannelWorkspace(testbed);
    const channel = newChannel(testbed, workspace.workspaceId, {
      createdByUserId: workspace.userId,
      externalId: testbed.ids.generate(),
      ...overrides,
    });
    await testbed.tenants.run(workspace.workspaceId, () =>
      testbed.channels.insertIfAbsent(channel),
    );
    return { ...workspace, channel };
  };

  it('lists connected telegram channels across workspaces', async () => {
    const first = await seed({ status: ChannelStatus.Connected });
    const second = await seed({ status: ChannelStatus.Connected });
    const pending = await seed({ status: ChannelStatus.Pending });
    const api = await seed({
      kind: ChannelKind.Api,
      identity: { name: 'API channel', replyMode: ApiReplyMode.Response, webhook: null },
      status: ChannelStatus.Connected,
    });

    const rows = await pollerChannels.listConnected();
    const ids = rows.map((row) => row.id);

    expect(ids).toContain(first.channel.id);
    expect(ids).toContain(second.channel.id);
    expect(ids).not.toContain(pending.channel.id);
    expect(ids).not.toContain(api.channel.id);
    expect(rows.find((row) => row.id === first.channel.id)).toEqual({
      id: first.channel.id,
      workspaceId: first.workspaceId,
      credentialsSealed: first.channel.credentialsSealed,
    });
  });
});
