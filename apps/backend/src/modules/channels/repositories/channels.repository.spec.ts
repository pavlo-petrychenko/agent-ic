import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ChannelStatus } from '@/modules/channels/constants/channel.constants';
import { ChannelEventsRepository } from '@/modules/channels/repositories/channel-events.repository';
import { ChannelsRepository } from '@/modules/channels/repositories/channels.repository';
import { TelegramChannelsRepository } from '@/modules/channels/repositories/telegram-channels.repository';
import { ChannelTokenService } from '@/modules/channels/services/channel-token.service';
import type { ChannelPatch, NewChannel } from '@/modules/channels/typedefs/channel.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import {
  TEST_CHANNEL_NAME,
  TEST_CHANNEL_UPDATE_ID,
  TEST_TELEGRAM_BOT_ID,
  TEST_TELEGRAM_TOKEN,
} from '@test/support/constants/channel-testing.constants';
import {
  ROW_LEVEL_SECURITY_VIOLATION,
  UNIQUE_VIOLATION,
} from '@test/support/constants/postgres-errors.constants';
import {
  newChannel,
  newChannelEvent,
  newTelegramChannel,
} from '@test/support/fixtures/channel.fixture';
import { createChannelsTestbed } from '@test/support/helpers/channels-testing.helpers';
import type { ChannelsTestbed } from '@test/support/typedefs/channels-testing.typedefs';

const channelPatch = (
  channel: NewChannel,
  overrides: Partial<ChannelPatch> = {},
): ChannelPatch => ({
  status: channel.status,
  agentId: channel.agentId ?? null,
  lastUpdateAt: channel.lastUpdateAt ?? null,
  updatedAt: channel.updatedAt,
  ...overrides,
});

describe('Channels repositories across tenants', () => {
  let testbed: ChannelsTestbed;
  let channels: ChannelsRepository;
  let telegramChannels: TelegramChannelsRepository;
  let events: ChannelEventsRepository;
  let tokens: ChannelTokenService;
  let tenants: TenantTransactionService;

  beforeAll(async () => {
    testbed = await createChannelsTestbed();
    channels = testbed.channels;
    telegramChannels = testbed.telegramChannels;
    events = testbed.channelEvents;
    tokens = testbed.channelTokens;
    tenants = testbed.tenants;
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('stores and reads a channel inside its workspace', async () => {
    const workspaceA = testbed.ids.generate();
    const channel = newChannel(testbed, workspaceA);

    await tenants.run(workspaceA, () => channels.insert(channel));

    const found = await tenants.run(workspaceA, () => channels.findById(workspaceA, channel.id));
    const listed = await tenants.run(workspaceA, () => channels.list(workspaceA));
    expect(found).toMatchObject({ id: channel.id, workspaceId: workspaceA });
    expect(listed.map((row) => row.id)).toEqual([channel.id]);
  });

  it('stores the Telegram profile beside the channel', async () => {
    const workspaceA = testbed.ids.generate();
    const channel = newChannel(testbed, workspaceA);
    const telegram = newTelegramChannel(testbed, channel);

    await tenants.run(workspaceA, async () => {
      await channels.insert(channel);
      await telegramChannels.insert(telegram);
    });

    const found = await tenants.run(workspaceA, () =>
      telegramChannels.findByChannelId(workspaceA, channel.id),
    );
    expect(found).toMatchObject({
      channelId: channel.id,
      workspaceId: workspaceA,
      name: TEST_CHANNEL_NAME,
      botId: telegram.botId,
    });
  });

  it('never shows or changes a channel from another workspace', async () => {
    const workspaceA = testbed.ids.generate();
    const workspaceB = testbed.ids.generate();
    const channel = newChannel(testbed, workspaceA);
    await tenants.run(workspaceA, () => channels.insert(channel));

    const seenFromB = await tenants.run(workspaceB, async () => ({
      found: await channels.findById(workspaceA, channel.id),
      listed: await channels.list(workspaceA),
      updated: await channels.update(
        workspaceA,
        channel.id,
        channelPatch(channel, {
          status: ChannelStatus.Connected,
          updatedAt: testbed.clock.now(),
        }),
      ),
      deleted: await channels.delete(workspaceA, channel.id),
    }));

    expect(seenFromB).toEqual({ found: null, listed: [], updated: null, deleted: false });
    expect(await tenants.run(workspaceA, () => channels.list(workspaceA))).toHaveLength(1);
  });

  it('never shows or changes a Telegram profile from another workspace', async () => {
    const workspaceA = testbed.ids.generate();
    const workspaceB = testbed.ids.generate();
    const channel = newChannel(testbed, workspaceA);
    await tenants.run(workspaceA, async () => {
      await channels.insert(channel);
      await telegramChannels.insert(newTelegramChannel(testbed, channel));
    });

    const seenFromB = await tenants.run(workspaceB, async () => ({
      found: await telegramChannels.findByChannelId(workspaceA, channel.id),
      updated: await telegramChannels.update(workspaceA, channel.id, { name: 'Changed' }),
    }));

    expect(seenFromB).toEqual({ found: null, updated: null });
    await expect(
      tenants.run(workspaceA, () => telegramChannels.findByChannelId(workspaceA, channel.id)),
    ).resolves.toMatchObject({ name: TEST_CHANNEL_NAME });
  });

  it('refuses to write a channel into another workspace', async () => {
    const workspaceA = testbed.ids.generate();
    const workspaceB = testbed.ids.generate();
    const write = tenants.run(workspaceB, () => channels.insert(newChannel(testbed, workspaceA)));

    await expect(write).rejects.toMatchObject(ROW_LEVEL_SECURITY_VIOLATION);
  });

  it('refuses to write a Telegram profile into another workspace', async () => {
    const workspaceA = testbed.ids.generate();
    const workspaceB = testbed.ids.generate();
    const channel = newChannel(testbed, workspaceA);
    await tenants.run(workspaceA, () => channels.insert(channel));

    const write = tenants.run(workspaceB, () =>
      telegramChannels.insert(newTelegramChannel(testbed, channel)),
    );

    await expect(write).rejects.toMatchObject(ROW_LEVEL_SECURITY_VIOLATION);
  });

  it('updates a channel with an explicit timestamp', async () => {
    const workspaceA = testbed.ids.generate();
    const channel = newChannel(testbed, workspaceA);
    const agentId = testbed.ids.generate();
    const at = new Date(testbed.clock.now().getTime() + 1_000);
    await tenants.run(workspaceA, () => channels.insert(channel));

    const updated = await tenants.run(workspaceA, () =>
      channels.update(
        workspaceA,
        channel.id,
        channelPatch(channel, {
          status: ChannelStatus.Connected,
          agentId,
          lastUpdateAt: at,
          updatedAt: at,
        }),
      ),
    );

    expect(updated).toMatchObject({
      status: ChannelStatus.Connected,
      agentId,
      lastUpdateAt: at,
      updatedAt: at,
    });
  });

  it('updates the Telegram profile', async () => {
    const workspaceA = testbed.ids.generate();
    const channel = newChannel(testbed, workspaceA);
    await tenants.run(workspaceA, async () => {
      await channels.insert(channel);
      await telegramChannels.insert(newTelegramChannel(testbed, channel));
    });

    const updated = await tenants.run(workspaceA, () =>
      telegramChannels.update(workspaceA, channel.id, {
        name: 'Changed',
        showTyping: false,
        tokenSealed: 'sealed-2',
      }),
    );

    expect(updated).toMatchObject({
      name: 'Changed',
      showTyping: false,
      tokenSealed: 'sealed-2',
    });
  });

  it('keeps a Telegram bot unique across workspaces', async () => {
    const workspaceA = testbed.ids.generate();
    const workspaceB = testbed.ids.generate();
    const firstChannel = newChannel(testbed, workspaceA);
    const first = newTelegramChannel(testbed, firstChannel, { botId: TEST_TELEGRAM_BOT_ID });
    await tenants.run(workspaceA, async () => {
      await channels.insert(firstChannel);
      await telegramChannels.insert(first);
    });

    const duplicateChannel = newChannel(testbed, workspaceB);
    const duplicate = newTelegramChannel(testbed, duplicateChannel, {
      botId: TEST_TELEGRAM_BOT_ID,
    });
    await tenants.run(workspaceB, () => channels.insert(duplicateChannel));

    await expect(
      tenants.run(workspaceB, () => telegramChannels.insert(duplicate)),
    ).rejects.toMatchObject(UNIQUE_VIOLATION);
  });

  it('keeps each external event only once per channel', async () => {
    const workspaceA = testbed.ids.generate();
    const first = newChannel(testbed, workspaceA);
    const second = newChannel(testbed, workspaceA);
    await tenants.run(workspaceA, async () => {
      await channels.insert(first);
      await channels.insert(second);
    });
    const event = newChannelEvent(testbed, first, { externalId: TEST_CHANNEL_UPDATE_ID });

    const firstInsert = await tenants.run(workspaceA, () => events.insertIfAbsent(event));
    const duplicate = await tenants.run(workspaceA, () => events.insertIfAbsent(event));
    const otherChannel = await tenants.run(workspaceA, () =>
      events.insertIfAbsent(
        newChannelEvent(testbed, second, { externalId: TEST_CHANNEL_UPDATE_ID }),
      ),
    );

    expect([firstInsert, duplicate, otherChannel]).toEqual([true, false, true]);
  });

  it('seals and opens a channel token', () => {
    const sealed = tokens.seal(TEST_TELEGRAM_TOKEN);

    expect(sealed).not.toBe(TEST_TELEGRAM_TOKEN);
    expect(tokens.open(sealed)).toBe(TEST_TELEGRAM_TOKEN);
  });
});
