import { ChannelKind, ErrorReason, IdPrefix, WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { CHANNEL_REPLACE_TOKEN_RATE_LIMIT } from '@/modules/channels/constants/channel-rate-limit.constants';
import { ChannelStatus } from '@/modules/channels/constants/channel.constants';
import { ChannelNotFoundError } from '@/modules/channels/errors/channel-not-found.error';
import { InvalidChannelInputError } from '@/modules/channels/errors/invalid-channel-input.error';
import { TelegramApiError } from '@/modules/channels/errors/telegram-api.error';
import { TelegramTokenInvalidError } from '@/modules/channels/errors/telegram-token-invalid.error';
import { ReplaceTelegramTokenUseCase } from '@/modules/channels/use-cases/replace-telegram-token.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { SecureTokenService } from '@/platform/crypto/services/secure-token.service';
import { RateLimitedError } from '@/platform/rate-limit/errors/rate-limited.error';
import { RateLimitService } from '@/platform/rate-limit/services/rate-limit.service';
import {
  TEST_TELEGRAM_BOT_ID,
  TEST_TELEGRAM_BOT_NAME,
  TEST_TELEGRAM_BOT_USERNAME,
  TEST_TELEGRAM_TOKEN,
} from '@test/support/constants/channel-testing.constants';
import { newChannel } from '@test/support/fixtures/channel.fixture';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import {
  createChannelsTestbed,
  seedChannelWorkspace,
} from '@test/support/helpers/channels-testing.helpers';
import type { ChannelsTestbed } from '@test/support/typedefs/channels-testing.typedefs';

const NEW_TOKEN = `700000001:${'B'.repeat(35)}`;
const EXPECTED_WEBHOOK_BASE = 'https://app.agent-ic.test/webhooks/telegram';

describe('ReplaceTelegramTokenUseCase', () => {
  let testbed: ChannelsTestbed;
  let replace: ReplaceTelegramTokenUseCase;
  let secureTokens: SecureTokenService;

  beforeAll(async () => {
    testbed = await createChannelsTestbed();
    replace = testbed.module.get(ReplaceTelegramTokenUseCase);
    secureTokens = testbed.module.get(SecureTokenService);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  beforeEach(() => {
    testbed.telegram.getMeCalls.length = 0;
    testbed.telegram.setWebhookCalls.length = 0;
    testbed.telegram.deleteWebhookCalls.length = 0;
    testbed.telegram.bot = {
      id: TEST_TELEGRAM_BOT_ID,
      username: TEST_TELEGRAM_BOT_USERNAME,
      firstName: TEST_TELEGRAM_BOT_NAME,
    };
  });

  const seedChannel = async (status: ChannelStatus = ChannelStatus.Broken) => {
    const workspace = await seedChannelWorkspace(testbed);
    const botId = testbed.ids.generate();
    testbed.telegram.bot = {
      id: botId,
      username: TEST_TELEGRAM_BOT_USERNAME,
      firstName: TEST_TELEGRAM_BOT_NAME,
    };
    const channel = newChannel(testbed, workspace.workspaceId, {
      createdByUserId: workspace.userId,
      status,
      externalId: botId,
    });
    await testbed.tenants.run(workspace.workspaceId, () =>
      testbed.channels.insertIfAbsent(channel),
    );
    return {
      ...workspace,
      channel,
      ctx: workspaceCtx(workspace.userId, workspace.workspaceId, WorkspaceRole.Owner),
      publicId: testbed.ids.toPublic(IdPrefix.Channel, channel.id),
    };
  };

  it('seals the new token, registers the webhook and marks the channel connected', async () => {
    const { channel, ctx, publicId, workspaceId, userId } = await seedChannel();

    const view = await replace.execute(ctx, { id: publicId, token: NEW_TOKEN });

    expect(view).toMatchObject({
      id: publicId,
      kind: ChannelKind.Telegram,
      status: ChannelStatus.Connected,
      displayName: TEST_TELEGRAM_BOT_USERNAME,
      firstName: TEST_TELEGRAM_BOT_NAME,
    });
    expect(testbed.telegram.getMeCalls).toEqual([NEW_TOKEN]);
    expect(testbed.telegram.setWebhookCalls).toHaveLength(1);
    const webhook = testbed.telegram.setWebhookCalls[0];
    expect(webhook?.url).toBe(
      `${EXPECTED_WEBHOOK_BASE}/${testbed.ids.toPublic(IdPrefix.Workspace, workspaceId)}/${publicId}`,
    );
    expect(webhook?.allowedUpdates).toEqual(['message', 'callback_query', 'my_chat_member']);

    const stored = await testbed.tenants.run(workspaceId, () =>
      testbed.channels.findById(workspaceId, channel.id),
    );
    if (stored === null) {
      throw new Error('Expected a stored channel');
    }
    expect(stored.status).toBe(ChannelStatus.Connected);
    expect(stored.updatedByUserId).toBe(userId);
    expect(stored.credentialsSealed).not.toContain(NEW_TOKEN);
    const credentials = testbed.channelTokens.openCredentials(stored.credentialsSealed);
    if (!('webhookSecretHash' in credentials)) {
      throw new Error('Expected Telegram credentials');
    }
    expect(credentials.botToken).toBe(NEW_TOKEN);
    expect(credentials.botToken).not.toBe(TEST_TELEGRAM_TOKEN);
    expect(secureTokens.matches(webhook?.secret ?? '', credentials.webhookSecretHash)).toBe(true);
  });

  it('never replaces the token of a channel from another workspace', async () => {
    const { publicId } = await seedChannel();
    const other = await seedChannelWorkspace(testbed);

    await expect(
      replace.execute(workspaceCtx(other.userId, other.workspaceId, WorkspaceRole.Owner), {
        id: publicId,
        token: NEW_TOKEN,
      }),
    ).rejects.toBeInstanceOf(ChannelNotFoundError);
    expect(testbed.telegram.setWebhookCalls).toHaveLength(0);
  });

  it('refuses a channel that is not a Telegram bot', async () => {
    const { workspaceId, userId } = await seedChannelWorkspace(testbed);
    const channel = newChannel(testbed, workspaceId, {
      createdByUserId: userId,
      kind: ChannelKind.Api,
      identity: { name: 'Booking widget' },
      externalId: testbed.ids.generate(),
    });
    await testbed.tenants.run(workspaceId, () => testbed.channels.insertIfAbsent(channel));

    await expect(
      replace.execute(workspaceCtx(userId, workspaceId, WorkspaceRole.Owner), {
        id: testbed.ids.toPublic(IdPrefix.Channel, channel.id),
        token: NEW_TOKEN,
      }),
    ).rejects.toBeInstanceOf(ChannelNotFoundError);
  });

  it('refuses a malformed token before calling Telegram', async () => {
    const { ctx, publicId } = await seedChannel();

    await expect(
      replace.execute(ctx, { id: publicId, token: 'not-a-token' }),
    ).rejects.toBeInstanceOf(InvalidChannelInputError);
    expect(testbed.telegram.getMeCalls).toHaveLength(0);
  });

  it('refuses a workspace that has used up its replacement attempts', async () => {
    const { ctx, publicId, workspaceId } = await seedChannel();
    await testbed.module
      .get(RateLimitService)
      .consume(
        CHANNEL_REPLACE_TOKEN_RATE_LIMIT,
        workspaceId,
        CHANNEL_REPLACE_TOKEN_RATE_LIMIT.capacity,
      );

    await expect(replace.execute(ctx, { id: publicId, token: NEW_TOKEN })).rejects.toBeInstanceOf(
      RateLimitedError,
    );
    expect(testbed.telegram.getMeCalls).toHaveLength(0);
  });

  it('maps an invalid token to a domain error', async () => {
    const { ctx, publicId } = await seedChannel();
    testbed.telegram.failNext(
      new TelegramApiError({ method: 'getMe', status: 401, description: 'Unauthorized' }),
    );

    await expect(replace.execute(ctx, { id: publicId, token: NEW_TOKEN })).rejects.toBeInstanceOf(
      TelegramTokenInvalidError,
    );
    expect(testbed.telegram.setWebhookCalls).toHaveLength(0);
  });

  it('refuses a token that belongs to another bot', async () => {
    const { ctx, publicId } = await seedChannel();
    testbed.telegram.bot = {
      id: testbed.ids.generate(),
      username: 'another_bot',
      firstName: 'Another bot',
    };

    await expect(replace.execute(ctx, { id: publicId, token: NEW_TOKEN })).rejects.toMatchObject({
      reason: ErrorReason.TelegramTokenInvalid,
    });
    expect(testbed.telegram.setWebhookCalls).toHaveLength(0);
  });

  it('refuses an operator', async () => {
    const { workspaceId, userId, publicId } = await seedChannel();

    await expect(
      replace.execute(workspaceCtx(userId, workspaceId, WorkspaceRole.Operator), {
        id: publicId,
        token: NEW_TOKEN,
      }),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
