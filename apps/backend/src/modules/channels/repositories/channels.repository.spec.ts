import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ChannelStatus } from '@/modules/channels/constants/channel.constants';
import { ChannelUpdatesRepository } from '@/modules/channels/repositories/channel-updates.repository';
import { ChannelsRepository } from '@/modules/channels/repositories/channels.repository';
import { ChannelTokenService } from '@/modules/channels/services/channel-token.service';
import type { ChannelPatch, NewChannel } from '@/modules/channels/typedefs/channel.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import {
  TEST_CHANNEL_UPDATE_ID,
  TEST_TELEGRAM_BOT_ID,
  TEST_TELEGRAM_TOKEN,
} from '@test/support/constants/channel-testing.constants';
import {
  ROW_LEVEL_SECURITY_VIOLATION,
  UNIQUE_VIOLATION,
} from '@test/support/constants/postgres-errors.constants';
import { newChannel, newChannelUpdate } from '@test/support/fixtures/channel.fixture';
import { createChannelsTestbed } from '@test/support/helpers/channels-testing.helpers';
import type { ChannelsTestbed } from '@test/support/typedefs/channels-testing.typedefs';

const channelPatch = (
  channel: NewChannel,
  overrides: Partial<ChannelPatch> = {},
): ChannelPatch => ({
  status: channel.status,
  agentId: channel.agentId ?? null,
  name: channel.name,
  telegramBotId: channel.telegramBotId ?? null,
  telegramUsername: channel.telegramUsername ?? null,
  tokenSealed: channel.tokenSealed ?? null,
  webhookSecretHash: channel.webhookSecretHash ?? null,
  showTyping: channel.showTyping,
  lastUpdateAt: channel.lastUpdateAt ?? null,
  updatedAt: channel.updatedAt,
  ...overrides,
});

describe('Channels repositories across tenants', () => {
  let testbed: ChannelsTestbed;
  let channels: ChannelsRepository;
  let updates: ChannelUpdatesRepository;
  let tokens: ChannelTokenService;
  let tenants: TenantTransactionService;

  beforeAll(async () => {
    testbed = await createChannelsTestbed();
    channels = testbed.channels;
    updates = testbed.channelUpdates;
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
        channelPatch(channel, { name: 'Changed', updatedAt: testbed.clock.now() }),
      ),
      deleted: await channels.delete(workspaceA, channel.id),
    }));

    expect(seenFromB).toEqual({ found: null, listed: [], updated: null, deleted: false });
    expect(await tenants.run(workspaceA, () => channels.list(workspaceA))).toHaveLength(1);
  });

  it('refuses to write a channel into another workspace', async () => {
    const workspaceA = testbed.ids.generate();
    const workspaceB = testbed.ids.generate();
    const write = tenants.run(workspaceB, () => channels.insert(newChannel(testbed, workspaceA)));

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
          showTyping: false,
          lastUpdateAt: at,
          updatedAt: at,
        }),
      ),
    );

    expect(updated).toMatchObject({
      status: ChannelStatus.Connected,
      agentId,
      showTyping: false,
      lastUpdateAt: at,
      updatedAt: at,
    });
  });

  it('keeps a Telegram bot unique while its channel is active', async () => {
    const workspaceA = testbed.ids.generate();
    const workspaceB = testbed.ids.generate();
    const first = newChannel(testbed, workspaceA, { telegramBotId: TEST_TELEGRAM_BOT_ID });
    await tenants.run(workspaceA, () => channels.insert(first));

    const duplicate = newChannel(testbed, workspaceB, { telegramBotId: TEST_TELEGRAM_BOT_ID });
    await expect(tenants.run(workspaceB, () => channels.insert(duplicate))).rejects.toMatchObject(
      UNIQUE_VIOLATION,
    );

    await tenants.run(workspaceA, () =>
      channels.update(
        workspaceA,
        first.id,
        channelPatch(first, {
          status: ChannelStatus.Disconnected,
          updatedAt: testbed.clock.now(),
        }),
      ),
    );

    await expect(
      tenants.run(workspaceB, () => channels.insert(duplicate)),
    ).resolves.toBeUndefined();
  });

  it('keeps each external update only once per channel', async () => {
    const workspaceA = testbed.ids.generate();
    const first = newChannel(testbed, workspaceA);
    const second = newChannel(testbed, workspaceA);
    await tenants.run(workspaceA, async () => {
      await channels.insert(first);
      await channels.insert(second);
    });
    const update = newChannelUpdate(testbed, first, { externalId: TEST_CHANNEL_UPDATE_ID });

    const firstInsert = await tenants.run(workspaceA, () => updates.insertIfAbsent(update));
    const duplicate = await tenants.run(workspaceA, () => updates.insertIfAbsent(update));
    const otherChannel = await tenants.run(workspaceA, () =>
      updates.insertIfAbsent(
        newChannelUpdate(testbed, second, { externalId: TEST_CHANNEL_UPDATE_ID }),
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
