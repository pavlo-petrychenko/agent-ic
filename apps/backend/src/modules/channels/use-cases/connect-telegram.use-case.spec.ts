import { ChannelKind, ErrorReason, IdPrefix, WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { CHANNEL_CONNECT_RATE_LIMIT } from '@/modules/channels/constants/channel-rate-limit.constants';
import { ChannelStatus } from '@/modules/channels/constants/channel.constants';
import { ChannelAlreadyConnectedError } from '@/modules/channels/errors/channel-already-connected.error';
import { InvalidChannelInputError } from '@/modules/channels/errors/invalid-channel-input.error';
import { TelegramApiError } from '@/modules/channels/errors/telegram-api.error';
import { TelegramTokenInvalidError } from '@/modules/channels/errors/telegram-token-invalid.error';
import { ConnectTelegramChannelUseCase } from '@/modules/channels/use-cases/connect-telegram.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { SecureTokenService } from '@/platform/crypto/services/secure-token.service';
import { RateLimitedError } from '@/platform/rate-limit/errors/rate-limited.error';
import { RateLimitService } from '@/platform/rate-limit/services/rate-limit.service';
import {
  TEST_TELEGRAM_BOT_NAME,
  TEST_TELEGRAM_BOT_USERNAME,
} from '@test/support/constants/channel-testing.constants';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import { createChannelsTestbed } from '@test/support/helpers/channels-testing.helpers';
import { seedAgent } from '@test/support/helpers/conversations-testing.helpers';
import { ensureUserRow } from '@test/support/helpers/parent-rows.helpers';
import type { ChannelsTestbed } from '@test/support/typedefs/channels-testing.typedefs';

const CONNECT_TOKEN = `700000001:${'A'.repeat(35)}`;
const EXPECTED_WEBHOOK_BASE = 'https://app.agent-ic.test/webhooks/telegram';

describe('ConnectTelegramChannelUseCase', () => {
  let testbed: ChannelsTestbed;
  let connect: ConnectTelegramChannelUseCase;
  let secureTokens: SecureTokenService;

  beforeAll(async () => {
    testbed = await createChannelsTestbed();
    connect = testbed.module.get(ConnectTelegramChannelUseCase);
    secureTokens = testbed.module.get(SecureTokenService);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  beforeEach(() => {
    testbed.telegram.getMeCalls.length = 0;
    testbed.telegram.setWebhookCalls.length = 0;
    testbed.telegram.deleteWebhookCalls.length = 0;
    testbed.telegram.getWebhookInfoCalls.length = 0;
  });

  const workspace = () => testbed.ids.generate();
  const agentPublicId = (agentId: string) => testbed.ids.toPublic(IdPrefix.Agent, agentId);

  const execute = async (
    workspaceId: string,
    agentId: string,
    token: string = CONNECT_TOKEN,
    showTyping: boolean = true,
  ) => {
    const userId = testbed.ids.generate();
    await ensureUserRow(testbed.module, userId);
    return connect.execute(workspaceCtx(userId, workspaceId, WorkspaceRole.Owner), {
      token,
      agentId: agentPublicId(agentId),
      showTyping,
    });
  };

  it('connects a bot, seals its credentials and registers the webhook', async () => {
    const workspaceId = workspace();
    const agentId = await seedAgent(testbed, workspaceId);
    const botId = testbed.ids.generate();
    testbed.telegram.bot = {
      id: botId,
      username: TEST_TELEGRAM_BOT_USERNAME,
      firstName: TEST_TELEGRAM_BOT_NAME,
    };

    const channel = await execute(workspaceId, agentId);

    expect(channel).toMatchObject({
      kind: ChannelKind.Telegram,
      status: ChannelStatus.Connected,
      agentId: agentPublicId(agentId),
      displayName: TEST_TELEGRAM_BOT_USERNAME,
      showTyping: true,
    });
    expect(channel.id.startsWith(`${IdPrefix.Channel}_`)).toBe(true);
    expect(testbed.telegram.getMeCalls).toEqual([CONNECT_TOKEN]);
    expect(testbed.telegram.setWebhookCalls).toHaveLength(1);

    const webhook = testbed.telegram.setWebhookCalls[0];
    expect(webhook?.url).toBe(
      `${EXPECTED_WEBHOOK_BASE}/${testbed.ids.toPublic(IdPrefix.Workspace, workspaceId)}/${channel.id}`,
    );
    expect(webhook?.allowedUpdates).toEqual(['message', 'callback_query', 'my_chat_member']);

    const stored = await testbed.tenants.run(workspaceId, () =>
      testbed.channels.findByKindAndExternalId(workspaceId, ChannelKind.Telegram, botId),
    );
    expect(stored).not.toBeNull();
    if (stored === null) {
      throw new Error('Expected a stored channel');
    }
    expect(stored.status).toBe(ChannelStatus.Connected);
    expect(stored.identity).toEqual({
      username: TEST_TELEGRAM_BOT_USERNAME,
      firstName: TEST_TELEGRAM_BOT_NAME,
    });
    expect(stored.credentialsSealed).not.toContain(CONNECT_TOKEN);
    const credentials = testbed.channelTokens.openCredentials(stored.credentialsSealed);
    if (!('webhookSecretHash' in credentials)) {
      throw new Error('Expected Telegram credentials');
    }
    expect(credentials.botToken).toBe(CONNECT_TOKEN);
    expect(secureTokens.matches(webhook?.secret ?? '', credentials.webhookSecretHash)).toBe(true);
  });

  it('refuses a bot that is already connected', async () => {
    const workspaceId = workspace();
    const agentId = await seedAgent(testbed, workspaceId);
    testbed.telegram.bot = {
      id: testbed.ids.generate(),
      username: TEST_TELEGRAM_BOT_USERNAME,
      firstName: TEST_TELEGRAM_BOT_NAME,
    };
    await execute(workspaceId, agentId);

    await expect(execute(workspaceId, agentId)).rejects.toBeInstanceOf(
      ChannelAlreadyConnectedError,
    );
    expect(testbed.telegram.setWebhookCalls).toHaveLength(1);
  });

  it('refuses an agent from another workspace', async () => {
    const workspaceId = workspace();
    const otherWorkspaceId = workspace();
    const otherAgentId = await seedAgent(testbed, otherWorkspaceId);

    await expect(execute(workspaceId, otherAgentId)).rejects.toMatchObject({
      reason: ErrorReason.AgentNotFound,
    });
    expect(testbed.telegram.getMeCalls).toHaveLength(0);
  });

  it('refuses a malformed token before calling Telegram', async () => {
    const workspaceId = workspace();
    const agentId = await seedAgent(testbed, workspaceId);

    await expect(execute(workspaceId, agentId, 'not-a-token')).rejects.toBeInstanceOf(
      InvalidChannelInputError,
    );
    expect(testbed.telegram.getMeCalls).toHaveLength(0);
  });

  it('refuses a workspace that has used up its connection attempts', async () => {
    const workspaceId = workspace();
    const agentId = await seedAgent(testbed, workspaceId);
    await testbed.module
      .get(RateLimitService)
      .consume(CHANNEL_CONNECT_RATE_LIMIT, workspaceId, CHANNEL_CONNECT_RATE_LIMIT.capacity);

    await expect(execute(workspaceId, agentId)).rejects.toBeInstanceOf(RateLimitedError);
    expect(testbed.telegram.getMeCalls).toHaveLength(0);
  });

  it('maps an invalid token to a domain error', async () => {
    const workspaceId = workspace();
    const agentId = await seedAgent(testbed, workspaceId);
    testbed.telegram.failNext(
      new TelegramApiError({ method: 'getMe', status: 401, description: 'Unauthorized' }),
    );

    await expect(execute(workspaceId, agentId)).rejects.toBeInstanceOf(TelegramTokenInvalidError);
  });

  it('refuses an operator', async () => {
    const workspaceId = workspace();
    const agentId = await seedAgent(testbed, workspaceId);
    const userId = testbed.ids.generate();
    await ensureUserRow(testbed.module, userId);

    await expect(
      connect.execute(workspaceCtx(userId, workspaceId, WorkspaceRole.Operator), {
        token: CONNECT_TOKEN,
        agentId: agentPublicId(agentId),
        showTyping: true,
      }),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
