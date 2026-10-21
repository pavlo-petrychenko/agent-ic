import { ChannelStatus, ChannelType } from '@/modules/channels/constants/channel.constants';
import type { NewChannelUpdate } from '@/modules/channels/typedefs/channel-update.typedefs';
import type { NewChannel } from '@/modules/channels/typedefs/channel.typedefs';
import {
  TEST_CHANNEL_NAME,
  TEST_TELEGRAM_BOT_USERNAME,
} from '@test/support/constants/channel-testing.constants';
import type { ChannelsTestbed } from '@test/support/typedefs/channels-testing.typedefs';

export const newChannel = (
  testbed: Pick<ChannelsTestbed, 'ids' | 'clock'>,
  workspaceId: string,
  overrides: Partial<NewChannel> = {},
): NewChannel => ({
  id: testbed.ids.generate(),
  workspaceId,
  kind: ChannelType.Telegram,
  status: ChannelStatus.Pending,
  agentId: null,
  name: TEST_CHANNEL_NAME,
  telegramBotId: testbed.ids.generate(),
  telegramUsername: TEST_TELEGRAM_BOT_USERNAME,
  tokenSealed: 'sealed-token',
  webhookSecretHash: 'webhook-secret-hash',
  showTyping: true,
  lastUpdateAt: null,
  createdByUserId: testbed.ids.generate(),
  createdAt: testbed.clock.now(),
  updatedAt: testbed.clock.now(),
  ...overrides,
});

export const newChannelUpdate = (
  testbed: Pick<ChannelsTestbed, 'ids' | 'clock'>,
  channel: Pick<NewChannel, 'id' | 'workspaceId'>,
  overrides: Partial<NewChannelUpdate> = {},
): NewChannelUpdate => ({
  id: testbed.ids.generate(),
  workspaceId: channel.workspaceId,
  channelId: channel.id,
  externalId: testbed.ids.generate(),
  receivedAt: testbed.clock.now(),
  ...overrides,
});
