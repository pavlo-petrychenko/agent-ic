import { ChannelKind, IdPrefix } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ChannelStatus } from '@/modules/channels/constants/channel.constants';
import { ChannelNotFoundError } from '@/modules/channels/errors/channel-not-found.error';
import { InvalidChannelInputError } from '@/modules/channels/errors/invalid-channel-input.error';
import { TelegramWebhookUnauthorizedError } from '@/modules/channels/errors/telegram-webhook-unauthorized.error';
import { HandleTelegramWebhookUseCase } from '@/modules/channels/use-cases/handle-telegram-webhook.use-case';
import { SecureTokenService } from '@/platform/crypto/services/secure-token.service';
import { TEST_TELEGRAM_TOKEN } from '@test/support/constants/channel-testing.constants';
import { newChannel } from '@test/support/fixtures/channel.fixture';
import { channelEventsFor } from '@test/support/helpers/channel-events.helpers';
import {
  createChannelsTestbed,
  seedChannelWorkspace,
} from '@test/support/helpers/channels-testing.helpers';
import { seedAgent } from '@test/support/helpers/conversations-testing.helpers';
import type { ChannelsTestbed } from '@test/support/typedefs/channels-testing.typedefs';

const WEBHOOK_SECRET = 'webhook-secret';
const UPDATE_ID = 1000;

const webhookBody = (text = 'Hello') => ({
  update_id: UPDATE_ID,
  message: {
    message_id: 5,
    date: 1_760_000_000,
    text,
    chat: { id: 42 },
    from: { id: 900, first_name: 'Moshe' },
  },
});

describe('HandleTelegramWebhookUseCase', () => {
  let testbed: ChannelsTestbed;
  let handleWebhook: HandleTelegramWebhookUseCase;
  let secureTokens: SecureTokenService;

  beforeAll(async () => {
    testbed = await createChannelsTestbed();
    handleWebhook = testbed.module.get(HandleTelegramWebhookUseCase);
    secureTokens = testbed.module.get(SecureTokenService);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  const seed = async () => {
    const workspace = await seedChannelWorkspace(testbed);
    const agentId = await seedAgent(testbed, workspace.workspaceId);
    const channel = newChannel(testbed, workspace.workspaceId, {
      createdByUserId: workspace.userId,
      agentId,
      status: ChannelStatus.Connected,
      kind: ChannelKind.Telegram,
      externalId: testbed.ids.generate(),
      credentialsSealed: testbed.channelTokens.sealCredentials({
        botToken: TEST_TELEGRAM_TOKEN,
        webhookSecretHash: secureTokens.hash(WEBHOOK_SECRET),
      }),
    });
    await testbed.tenants.run(workspace.workspaceId, () =>
      testbed.channels.insertIfAbsent(channel),
    );
    return {
      workspaceId: workspace.workspaceId,
      channel,
      workspacePublicId: testbed.ids.toPublic(IdPrefix.Workspace, workspace.workspaceId),
      channelPublicId: testbed.ids.toPublic(IdPrefix.Channel, channel.id),
    };
  };

  const input = async (overrides: { readonly secret?: string | null } = {}) => {
    const seeded = await seed();
    return {
      ...seeded,
      input: {
        workspacePublicId: seeded.workspacePublicId,
        channelPublicId: seeded.channelPublicId,
        secret: overrides.secret === undefined ? WEBHOOK_SECRET : overrides.secret,
        body: webhookBody(),
      },
    };
  };

  it('stores a webhook update with the matching secret', async () => {
    const { input: request, channel } = await input();

    await handleWebhook.execute(request);

    await expect(channelEventsFor(testbed.module, channel.id)).resolves.toHaveLength(1);
  });

  it('ignores a duplicate update through the event key', async () => {
    const { input: request, channel } = await input();

    await handleWebhook.execute(request);
    await handleWebhook.execute(request);

    await expect(channelEventsFor(testbed.module, channel.id)).resolves.toHaveLength(1);
  });

  it('refuses a wrong secret', async () => {
    const { input: request, channel } = await input({ secret: 'wrong-secret' });

    await expect(handleWebhook.execute(request)).rejects.toBeInstanceOf(
      TelegramWebhookUnauthorizedError,
    );
    await expect(channelEventsFor(testbed.module, channel.id)).resolves.toEqual([]);
  });

  it('refuses a missing secret', async () => {
    const { input: request, channel } = await input({ secret: null });

    await expect(handleWebhook.execute(request)).rejects.toBeInstanceOf(
      TelegramWebhookUnauthorizedError,
    );
    await expect(channelEventsFor(testbed.module, channel.id)).resolves.toEqual([]);
  });

  it('refuses an unknown channel', async () => {
    const { input: request } = await input();

    await expect(
      handleWebhook.execute({
        ...request,
        channelPublicId: testbed.ids.toPublic(IdPrefix.Channel, testbed.ids.generate()),
      }),
    ).rejects.toBeInstanceOf(ChannelNotFoundError);
  });

  it('refuses a malformed body', async () => {
    const { input: request } = await input();

    await expect(
      handleWebhook.execute({ ...request, body: { message: {} } }),
    ).rejects.toBeInstanceOf(InvalidChannelInputError);
  });
});
