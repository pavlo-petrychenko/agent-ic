import { ChannelKind } from '@agent-ic/contracts';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ChannelStatus } from '@/modules/channels/constants/channel.constants';
import { TELEGRAM_ALLOWED_UPDATES } from '@/modules/channels/constants/telegram.constants';
import { TelegramApiError } from '@/modules/channels/errors/telegram-api.error';
import { TelegramPollerService } from '@/modules/channels/services/telegram-poller.service';
import type {
  TelegramPollerChannel,
  TelegramUpdate,
} from '@/modules/channels/typedefs/telegram.typedefs';
import { ConversationMode } from '@/modules/conversations';
import { TEST_TELEGRAM_TOKEN } from '@test/support/constants/channel-testing.constants';
import { newChannel } from '@test/support/fixtures/channel.fixture';
import {
  createChannelsTestbed,
  seedChannelWorkspace,
} from '@test/support/helpers/channels-testing.helpers';
import { seedAgent } from '@test/support/helpers/conversations-testing.helpers';
import type { ChannelsTestbed } from '@test/support/typedefs/channels-testing.typedefs';

const telegramUpdate = (updateId: number, messageId: number): TelegramUpdate => ({
  updateId: String(updateId),
  message: {
    messageId: String(messageId),
    sentAt: new Date('2026-10-27T10:00:00.000Z'),
    chatId: '42',
    senderId: '900',
    senderName: 'Moshe',
    text: 'Hello',
  },
});

describe('TelegramPollerService', () => {
  let testbed: ChannelsTestbed;
  let poller: TelegramPollerService;

  beforeAll(async () => {
    testbed = await createChannelsTestbed();
    poller = testbed.module.get(TelegramPollerService);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  beforeEach(() => {
    testbed.telegram.updates = [];
    testbed.telegram.getUpdatesCalls.length = 0;
  });

  const seed = async () => {
    const workspace = await seedChannelWorkspace(testbed);
    const agentId = await seedAgent(testbed, workspace.workspaceId);
    const channel = newChannel(testbed, workspace.workspaceId, {
      createdByUserId: workspace.userId,
      agentId,
      status: ChannelStatus.Connected,
      externalId: testbed.ids.generate(),
    });
    await testbed.tenants.run(workspace.workspaceId, () =>
      testbed.channels.insertIfAbsent(channel),
    );
    const pollerChannel: TelegramPollerChannel = {
      id: channel.id,
      workspaceId: workspace.workspaceId,
      credentialsSealed: channel.credentialsSealed,
    };
    return { ...workspace, agentId, channel, pollerChannel };
  };

  const conversationOf = (workspaceId: string, agentId: string) =>
    testbed.tenants.run(workspaceId, () =>
      testbed.conversations.findOpenForUpdate({
        workspaceId,
        agentId,
        channelKind: ChannelKind.Telegram,
        endUserExternalId: '42',
        mode: ConversationMode.Live,
      }),
    );

  it('polls a bot and stores the update', async () => {
    const { pollerChannel, workspaceId, agentId } = await seed();
    testbed.telegram.updates = [telegramUpdate(1000, 5)];

    await poller.pollChannel(pollerChannel);

    expect(testbed.telegram.getUpdatesCalls).toEqual([
      {
        token: TEST_TELEGRAM_TOKEN,
        offset: 0,
        timeoutSeconds: 20,
        allowedUpdates: TELEGRAM_ALLOWED_UPDATES,
      },
    ]);
    const conversation = await conversationOf(workspaceId, agentId);
    if (conversation === null) {
      throw new Error('Expected a conversation');
    }
    const stored = await testbed.tenants.run(workspaceId, () =>
      testbed.messages.findByExternalId(workspaceId, conversation.id, '5'),
    );
    expect(stored?.text).toBe('Hello');
  });

  it('advances the offset past the updates it processed', async () => {
    const { pollerChannel } = await seed();
    testbed.telegram.updates = [telegramUpdate(1000, 5)];
    await poller.pollChannel(pollerChannel);
    testbed.telegram.updates = [telegramUpdate(1001, 6)];

    await poller.pollChannel(pollerChannel);

    expect(testbed.telegram.getUpdatesCalls.map((call) => call.offset)).toEqual([0, 1001]);
  });

  it('advances the offset without storing a duplicate update', async () => {
    const { pollerChannel } = await seed();
    const update = telegramUpdate(1000, 5);
    testbed.telegram.updates = [update];
    await poller.pollChannel(pollerChannel);
    testbed.telegram.updates = [update];

    await poller.pollChannel(pollerChannel);

    expect(testbed.telegram.getUpdatesCalls.map((call) => call.offset)).toEqual([0, 1001]);
  });

  it('keeps polling after a telegram failure', async () => {
    const { pollerChannel } = await seed();
    testbed.telegram.failNext(new TelegramApiError({ method: 'getUpdates', status: 401 }));

    await expect(poller.pollChannel(pollerChannel)).resolves.toBeUndefined();
    expect(testbed.telegram.getUpdatesCalls).toHaveLength(1);
  });
});
