import { ChannelKind, IdPrefix, WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ChannelStatus } from '@/modules/channels/constants/channel.constants';
import { ChannelNotFoundError } from '@/modules/channels/errors/channel-not-found.error';
import { TelegramApiError } from '@/modules/channels/errors/telegram-api.error';
import { TelegramTokenInvalidError } from '@/modules/channels/errors/telegram-token-invalid.error';
import { RefreshTelegramIdentityUseCase } from '@/modules/channels/use-cases/refresh-telegram-identity.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { TEST_TELEGRAM_TOKEN } from '@test/support/constants/channel-testing.constants';
import { newChannel } from '@test/support/fixtures/channel.fixture';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import {
  createChannelsTestbed,
  seedChannelWorkspace,
} from '@test/support/helpers/channels-testing.helpers';
import type { ChannelsTestbed } from '@test/support/typedefs/channels-testing.typedefs';

describe('RefreshTelegramIdentityUseCase', () => {
  let testbed: ChannelsTestbed;
  let refresh: RefreshTelegramIdentityUseCase;

  beforeAll(async () => {
    testbed = await createChannelsTestbed();
    refresh = testbed.module.get(RefreshTelegramIdentityUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  beforeEach(() => {
    testbed.telegram.getMeCalls.length = 0;
  });

  const seed = async (status: ChannelStatus = ChannelStatus.Connected) => {
    const workspace = await seedChannelWorkspace(testbed);
    const botId = testbed.ids.generate();
    testbed.telegram.bot = {
      ...testbed.telegram.bot,
      id: botId,
      username: 'new_bot',
      firstName: 'New bot',
    };
    const channel = newChannel(testbed, workspace.workspaceId, {
      createdByUserId: workspace.userId,
      status,
      externalId: botId,
      identity: { username: 'old_bot', firstName: 'Old bot' },
      credentialsSealed: testbed.channelTokens.sealCredentials({
        botToken: TEST_TELEGRAM_TOKEN,
        webhookSecretHash: 'webhook-secret-hash',
      }),
    });
    await testbed.tenants.run(workspace.workspaceId, () =>
      testbed.channels.insertIfAbsent(channel),
    );
    return {
      ...workspace,
      channel,
      ctx: workspaceCtx(workspace.userId, workspace.workspaceId, WorkspaceRole.Owner),
      id: testbed.ids.toPublic(IdPrefix.Channel, channel.id),
    };
  };

  it('refreshes the bot username and first name without changing status', async () => {
    const { channel, ctx, id, workspaceId } = await seed();

    const view = await refresh.execute(ctx, { id });

    expect(view).toMatchObject({
      id,
      kind: ChannelKind.Telegram,
      status: ChannelStatus.Connected,
      displayName: 'new_bot',
      firstName: 'New bot',
    });
    expect(testbed.telegram.getMeCalls).toEqual([TEST_TELEGRAM_TOKEN]);
    const stored = await testbed.tenants.run(workspaceId, () =>
      testbed.channels.findById(workspaceId, channel.id),
    );
    expect(stored?.status).toBe(ChannelStatus.Connected);
    expect(stored?.identity).toEqual({ username: 'new_bot', firstName: 'New bot' });
  });

  it('keeps the old identity when the token was revoked', async () => {
    const { channel, ctx, id, workspaceId } = await seed();
    testbed.telegram.failNext(
      new TelegramApiError({ method: 'getMe', status: 401, description: 'Unauthorized' }),
    );

    await expect(refresh.execute(ctx, { id })).rejects.toBeInstanceOf(TelegramTokenInvalidError);

    const stored = await testbed.tenants.run(workspaceId, () =>
      testbed.channels.findById(workspaceId, channel.id),
    );
    expect(stored?.identity).toEqual({ username: 'old_bot', firstName: 'Old bot' });
  });

  it('refuses a token that belongs to another bot', async () => {
    const { channel, ctx, id, workspaceId } = await seed();
    testbed.telegram.bot = { ...testbed.telegram.bot, id: 'another-bot' };

    await expect(refresh.execute(ctx, { id })).rejects.toBeInstanceOf(TelegramTokenInvalidError);

    const stored = await testbed.tenants.run(workspaceId, () =>
      testbed.channels.findById(workspaceId, channel.id),
    );
    expect(stored?.identity).toEqual({ username: 'old_bot', firstName: 'Old bot' });
  });

  it('refuses a channel from another workspace', async () => {
    const first = await seed();
    const second = await seed();

    await expect(refresh.execute(first.ctx, { id: second.id })).rejects.toBeInstanceOf(
      ChannelNotFoundError,
    );
  });

  it('refuses an operator', async () => {
    const { channel, userId, workspaceId, id } = await seed();

    await expect(
      refresh.execute(workspaceCtx(userId, workspaceId, WorkspaceRole.Operator), { id }),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
    const stored = await testbed.tenants.run(workspaceId, () =>
      testbed.channels.findById(workspaceId, channel.id),
    );
    expect(stored?.identity).toEqual({ username: 'old_bot', firstName: 'Old bot' });
  });
});
