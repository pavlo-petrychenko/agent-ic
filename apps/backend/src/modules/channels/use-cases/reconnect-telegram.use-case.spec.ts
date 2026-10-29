import { ChannelKind, IdPrefix, WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ChannelStatus } from '@/modules/channels/constants/channel.constants';
import { ChannelNotFoundError } from '@/modules/channels/errors/channel-not-found.error';
import { TelegramApiError } from '@/modules/channels/errors/telegram-api.error';
import { TelegramTokenInvalidError } from '@/modules/channels/errors/telegram-token-invalid.error';
import { ReconnectTelegramUseCase } from '@/modules/channels/use-cases/reconnect-telegram.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { SecureTokenService } from '@/platform/crypto/services/secure-token.service';
import { TEST_TELEGRAM_TOKEN } from '@test/support/constants/channel-testing.constants';
import { newChannel } from '@test/support/fixtures/channel.fixture';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import {
  createChannelsTestbed,
  seedChannelWorkspace,
} from '@test/support/helpers/channels-testing.helpers';
import { seedAgent } from '@test/support/helpers/conversations-testing.helpers';
import type { ChannelsTestbed } from '@test/support/typedefs/channels-testing.typedefs';

describe('ReconnectTelegramUseCase', () => {
  let testbed: ChannelsTestbed;
  let reconnect: ReconnectTelegramUseCase;
  let secureTokens: SecureTokenService;

  beforeAll(async () => {
    testbed = await createChannelsTestbed();
    reconnect = testbed.module.get(ReconnectTelegramUseCase);
    secureTokens = testbed.module.get(SecureTokenService);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  beforeEach(() => {
    testbed.telegram.getMeCalls.length = 0;
    testbed.telegram.setWebhookCalls.length = 0;
    testbed.telegram.deleteWebhookCalls.length = 0;
  });

  const seed = async (
    status: ChannelStatus = ChannelStatus.Disconnected,
    overrides: {
      readonly agentId?: string | null;
      readonly externalId?: string;
      readonly botId?: string;
    } = {},
  ) => {
    const workspace = await seedChannelWorkspace(testbed);
    const agentId =
      overrides.agentId === undefined
        ? await seedAgent(testbed, workspace.workspaceId)
        : overrides.agentId;
    const botId = overrides.botId ?? testbed.ids.generate();
    testbed.telegram.bot = { ...testbed.telegram.bot, id: botId };
    const channel = newChannel(testbed, workspace.workspaceId, {
      createdByUserId: workspace.userId,
      agentId,
      status,
      externalId: overrides.externalId ?? botId,
      credentialsSealed: testbed.channelTokens.sealCredentials({
        botToken: TEST_TELEGRAM_TOKEN,
        webhookSecretHash: secureTokens.hash('old-webhook-secret'),
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

  it('reconnects a disconnected bot with its stored token', async () => {
    const { channel, ctx, id, workspaceId } = await seed();

    const view = await reconnect.execute(ctx, { id });

    expect(view).toMatchObject({
      id,
      kind: ChannelKind.Telegram,
      status: ChannelStatus.Connected,
    });
    expect(testbed.telegram.getMeCalls).toEqual([TEST_TELEGRAM_TOKEN]);
    expect(testbed.telegram.setWebhookCalls).toHaveLength(1);
    expect(testbed.telegram.setWebhookCalls[0]?.url).toContain('/webhooks/telegram/');
    const stored = await testbed.tenants.run(workspaceId, () =>
      testbed.channels.findById(workspaceId, channel.id),
    );
    expect(stored?.status).toBe(ChannelStatus.Connected);
    const credentials = testbed.channelTokens.openCredentials(stored?.credentialsSealed ?? '');
    expect(credentials).toMatchObject({ botToken: TEST_TELEGRAM_TOKEN });
    if (!('webhookSecretHash' in credentials)) {
      throw new Error('Expected Telegram credentials');
    }
    expect(
      secureTokens.matches(
        testbed.telegram.setWebhookCalls[0]?.secret ?? '',
        credentials.webhookSecretHash,
      ),
    ).toBe(true);
  });

  it('does nothing when the bot is already connected', async () => {
    const { channel, ctx, id } = await seed(ChannelStatus.Connected);

    const view = await reconnect.execute(ctx, { id });

    expect(view.status).toBe(ChannelStatus.Connected);
    expect(testbed.telegram.getMeCalls).toHaveLength(0);
    expect(testbed.telegram.setWebhookCalls).toHaveLength(0);
    expect(view.id).toBe(id);
    expect(channel.status).toBe(ChannelStatus.Connected);
  });

  it('keeps the channel disconnected when the token was revoked', async () => {
    const { channel, ctx, id, workspaceId } = await seed();
    testbed.telegram.failNext(
      new TelegramApiError({ method: 'getMe', status: 401, description: 'Unauthorized' }),
    );

    await expect(reconnect.execute(ctx, { id })).rejects.toBeInstanceOf(TelegramTokenInvalidError);

    const stored = await testbed.tenants.run(workspaceId, () =>
      testbed.channels.findById(workspaceId, channel.id),
    );
    expect(stored?.status).toBe(ChannelStatus.Disconnected);
    expect(testbed.telegram.setWebhookCalls).toHaveLength(0);
  });

  it('refuses a token that belongs to another bot', async () => {
    const { channel, ctx, id, workspaceId } = await seed(ChannelStatus.Disconnected, {
      externalId: 'another-bot',
    });

    await expect(reconnect.execute(ctx, { id })).rejects.toBeInstanceOf(TelegramTokenInvalidError);

    const stored = await testbed.tenants.run(workspaceId, () =>
      testbed.channels.findById(workspaceId, channel.id),
    );
    expect(stored?.status).toBe(ChannelStatus.Disconnected);
  });

  it('refuses a channel from another workspace', async () => {
    const first = await seed();
    const second = await seed();

    await expect(reconnect.execute(first.ctx, { id: second.id })).rejects.toBeInstanceOf(
      ChannelNotFoundError,
    );
    expect(testbed.telegram.setWebhookCalls).toHaveLength(0);
  });

  it('refuses an operator', async () => {
    const { channel, userId, workspaceId, id } = await seed();

    await expect(
      reconnect.execute(workspaceCtx(userId, workspaceId, WorkspaceRole.Operator), { id }),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
    const stored = await testbed.tenants.run(workspaceId, () =>
      testbed.channels.findById(workspaceId, channel.id),
    );
    expect(stored?.status).toBe(ChannelStatus.Disconnected);
  });
});
