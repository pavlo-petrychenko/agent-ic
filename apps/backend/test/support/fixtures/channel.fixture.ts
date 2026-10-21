import { ChannelStatus, ChannelType } from '@/modules/channels/constants/channel.constants';
import type { NewChannelEvent } from '@/modules/channels/typedefs/channel-event.typedefs';
import type { NewChannel, NewTelegramChannel } from '@/modules/channels/typedefs/channel.typedefs';
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
  lastUpdateAt: null,
  createdByUserId: testbed.ids.generate(),
  createdAt: testbed.clock.now(),
  updatedAt: testbed.clock.now(),
  ...overrides,
});

export const newTelegramChannel = (
  testbed: Pick<ChannelsTestbed, 'ids' | 'clock'>,
  channel: Pick<NewChannel, 'id' | 'workspaceId'>,
  overrides: Partial<NewTelegramChannel> = {},
): NewTelegramChannel => ({
  channelId: channel.id,
  workspaceId: channel.workspaceId,
  name: TEST_CHANNEL_NAME,
  botId: testbed.ids.generate(),
  username: TEST_TELEGRAM_BOT_USERNAME,
  tokenSealed: 'sealed-token',
  webhookSecretHash: 'webhook-secret-hash',
  showTyping: true,
  ...overrides,
});

export const newChannelEvent = (
  testbed: Pick<ChannelsTestbed, 'ids' | 'clock'>,
  channel: Pick<NewChannel, 'id' | 'workspaceId'>,
  overrides: Partial<NewChannelEvent> = {},
): NewChannelEvent => ({
  id: testbed.ids.generate(),
  workspaceId: channel.workspaceId,
  channelId: channel.id,
  externalId: testbed.ids.generate(),
  payload: {},
  receivedAt: testbed.clock.now(),
  ...overrides,
});
