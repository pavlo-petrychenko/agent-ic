import { ChannelKind } from '@agent-ic/contracts';
import { ChannelEventType } from '@/modules/channels/constants/channel-event.constants';
import { ChannelStatus } from '@/modules/channels/constants/channel.constants';
import type { NewChannelEvent } from '@/modules/channels/typedefs/channel-event.typedefs';
import type { NewChannel } from '@/modules/channels/typedefs/channel.typedefs';
import {
  TEST_CHANNEL_NAME,
  TEST_TELEGRAM_BOT_USERNAME,
  TEST_TELEGRAM_TOKEN,
} from '@test/support/constants/channel-testing.constants';
import type { ChannelsTestbed } from '@test/support/typedefs/channels-testing.typedefs';

export const newChannel = (
  testbed: Pick<ChannelsTestbed, 'ids' | 'clock' | 'channelTokens'>,
  workspaceId: string,
  overrides: Partial<NewChannel> = {},
): NewChannel => ({
  id: testbed.ids.generate(),
  workspaceId,
  kind: ChannelKind.Telegram,
  status: ChannelStatus.Pending,
  agentId: null,
  externalId: testbed.ids.generate(),
  identity: { name: TEST_CHANNEL_NAME, username: TEST_TELEGRAM_BOT_USERNAME },
  showTyping: true,
  credentialsSealed: testbed.channelTokens.sealCredentials({
    botToken: TEST_TELEGRAM_TOKEN,
    webhookSecretHash: 'hash',
  }),
  createdByUserId: testbed.ids.generate(),
  createdAt: testbed.clock.now(),
  updatedAt: testbed.clock.now(),
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
  type: ChannelEventType.Message,
  senderExternalId: testbed.ids.generate(),
  senderName: 'Test customer',
  text: 'Hello',
  sentAt: testbed.clock.now(),
  receivedAt: testbed.clock.now(),
  ...overrides,
});
