import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ChannelStatus } from '@/modules/channels/constants/channel.constants';
import { ChannelEventsRepository } from '@/modules/channels/repositories/channel-events.repository';
import { ChannelsRepository } from '@/modules/channels/repositories/channels.repository';
import { ChannelTokenService } from '@/modules/channels/services/channel-token.service';
import type { TelegramChannelCredentials } from '@/modules/channels/typedefs/channel-identity.typedefs';
import type { ChannelPatch, NewChannel } from '@/modules/channels/typedefs/channel.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import {
  TEST_CHANNEL_UPDATE_ID,
  TEST_TELEGRAM_BOT_ID,
  TEST_TELEGRAM_TOKEN,
} from '@test/support/constants/channel-testing.constants';
import { ROW_LEVEL_SECURITY_VIOLATION } from '@test/support/constants/postgres-errors.constants';
import { newChannel, newChannelEvent } from '@test/support/fixtures/channel.fixture';
import { createChannelsTestbed } from '@test/support/helpers/channels-testing.helpers';
import {
  ensureAgentRow,
  ensureUserRow,
  ensureWorkspaceRow,
} from '@test/support/helpers/parent-rows.helpers';
import type { ChannelsTestbed } from '@test/support/typedefs/channels-testing.typedefs';

const WEBHOOK_SECRET_HASH = 'webhook-secret-hash';

const telegramCredentials = (
  botToken: string = TEST_TELEGRAM_TOKEN,
): TelegramChannelCredentials => ({
  botToken,
  webhookSecretHash: WEBHOOK_SECRET_HASH,
});

const channelPatch = (
  channel: NewChannel,
  overrides: Partial<ChannelPatch> = {},
): ChannelPatch => ({
  status: channel.status,
  agentId: channel.agentId ?? null,
  identity: channel.identity,
  showTyping: channel.showTyping,
  credentialsSealed: channel.credentialsSealed,
  updatedAt: channel.updatedAt,
  ...overrides,
});

describe('Channels repositories across tenants', () => {
  let testbed: ChannelsTestbed;
  let channels: ChannelsRepository;
  let events: ChannelEventsRepository;
  let tokens: ChannelTokenService;
  let tenants: TenantTransactionService;

  beforeAll(async () => {
    testbed = await createChannelsTestbed();
    channels = testbed.channels;
    events = testbed.channelEvents;
    tokens = testbed.channelTokens;
    tenants = testbed.tenants;
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('stores and reads a channel inside its workspace', async () => {
    const workspaceA = testbed.ids.generate();
    const credentials = telegramCredentials();
    const credentialsSealed = tokens.sealCredentials(credentials);
    const channel = newChannel(testbed, workspaceA, { credentialsSealed });

    await tenants.run(workspaceA, () => channels.insertIfAbsent(channel));

    const found = await tenants.run(workspaceA, () => channels.findById(workspaceA, channel.id));
    const listed = await tenants.run(workspaceA, () => channels.list(workspaceA));
    expect(found).toMatchObject({
      id: channel.id,
      workspaceId: workspaceA,
      externalId: channel.externalId,
      identity: channel.identity,
      credentialsSealed,
    });
    expect(listed.map((row) => row.id)).toEqual([channel.id]);

    if (found === null) {
      throw new Error('Expected a stored channel');
    }
    expect(tokens.openCredentials(found.credentialsSealed)).toEqual(credentials);
  });

  it('never shows or changes a channel from another workspace', async () => {
    const workspaceA = testbed.ids.generate();
    await ensureWorkspaceRow(testbed.module, workspaceA);
    const workspaceB = testbed.ids.generate();
    await ensureWorkspaceRow(testbed.module, workspaceB);
    const channel = newChannel(testbed, workspaceA);
    await tenants.run(workspaceA, () => channels.insertIfAbsent(channel));

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

  it('refuses to write a channel into another workspace', async () => {
    const workspaceA = testbed.ids.generate();
    await ensureWorkspaceRow(testbed.module, workspaceA);
    const workspaceB = testbed.ids.generate();
    const write = tenants.run(workspaceB, () =>
      channels.insertIfAbsent(newChannel(testbed, workspaceA)),
    );

    await expect(write).rejects.toMatchObject(ROW_LEVEL_SECURITY_VIOLATION);
  });

  it('updates a channel with an explicit timestamp', async () => {
    const workspaceA = testbed.ids.generate();
    await ensureWorkspaceRow(testbed.module, workspaceA);
    const channel = newChannel(testbed, workspaceA);
    await ensureUserRow(testbed.module, channel.createdByUserId);
    const agentId = testbed.ids.generate();
    await ensureAgentRow(testbed.module, workspaceA, agentId);
    const at = new Date(testbed.clock.now().getTime() + 1_000);
    const credentials = telegramCredentials('changed-token');
    const credentialsSealed = tokens.sealCredentials(credentials);
    await tenants.run(workspaceA, () => channels.insertIfAbsent(channel));

    const updated = await tenants.run(workspaceA, () =>
      channels.update(
        workspaceA,
        channel.id,
        channelPatch(channel, {
          status: ChannelStatus.Connected,
          agentId,
          identity: { name: 'Changed', username: 'changed_bot' },
          showTyping: false,
          credentialsSealed,
          updatedAt: at,
        }),
      ),
    );

    expect(updated).toMatchObject({
      status: ChannelStatus.Connected,
      agentId,
      identity: { name: 'Changed', username: 'changed_bot' },
      showTyping: false,
      credentialsSealed,
      updatedAt: at,
    });

    if (updated === null) {
      throw new Error('Expected an updated channel');
    }
    expect(tokens.openCredentials(updated.credentialsSealed)).toEqual(credentials);
  });

  it('keeps a channel external id unique per kind across workspaces', async () => {
    const workspaceA = testbed.ids.generate();
    await ensureWorkspaceRow(testbed.module, workspaceA);
    const workspaceB = testbed.ids.generate();
    await ensureWorkspaceRow(testbed.module, workspaceB);
    const first = newChannel(testbed, workspaceA, { externalId: TEST_TELEGRAM_BOT_ID });
    await tenants.run(workspaceA, () => channels.insertIfAbsent(first));

    const duplicate = newChannel(testbed, workspaceB, { externalId: TEST_TELEGRAM_BOT_ID });

    const result = await tenants.run(workspaceB, () => channels.insertIfAbsent(duplicate));
    expect(result).toBe(false);
  });

  it('keeps each external event only once per channel', async () => {
    const workspaceA = testbed.ids.generate();
    await ensureWorkspaceRow(testbed.module, workspaceA);
    const first = newChannel(testbed, workspaceA);
    await ensureUserRow(testbed.module, first.createdByUserId);
    const second = newChannel(testbed, workspaceA);
    await ensureUserRow(testbed.module, second.createdByUserId);
    await tenants.run(workspaceA, async () => {
      await channels.insertIfAbsent(first);
      await channels.insertIfAbsent(second);
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

  it('seals and opens channel credentials', () => {
    const credentials = telegramCredentials();
    const sealed = tokens.sealCredentials(credentials);

    expect(sealed).not.toContain(TEST_TELEGRAM_TOKEN);
    expect(tokens.openCredentials(sealed)).toEqual(credentials);
  });
});
