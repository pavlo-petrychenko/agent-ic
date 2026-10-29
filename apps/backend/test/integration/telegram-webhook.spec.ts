import { IdPrefix } from '@agent-ic/contracts';
import type { INestApplication } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SAMPLE_AGENT_NAME } from '@/modules/agents/constants/sample-agent.constants';
import { AgentsRepository } from '@/modules/agents/repositories/agents.repository';
import { SampleAgentService } from '@/modules/agents/services/sample-agent.service';
import { ChannelStatus } from '@/modules/channels/constants/channel.constants';
import { TELEGRAM_WEBHOOK_PATH } from '@/modules/channels/constants/telegram.constants';
import { channelEvents } from '@/modules/channels/db/channel-events.table';
import { ChannelsRepository } from '@/modules/channels/repositories/channels.repository';
import { ChannelTokenService } from '@/modules/channels/services/channel-token.service';
import { SampleWorkspaceService } from '@/modules/identity';
import { FakeEmailGateway } from '@/modules/notifications/gateways/email.fake';
import { SamplePromptService } from '@/modules/prompts';
import { ClockService } from '@/platform/clock/services/clock.service';
import { SecureTokenService } from '@/platform/crypto/services/secure-token.service';
import { SystemDatabaseService } from '@/platform/database/services/system-database.service';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { HttpHeader } from '@/platform/http/constants/http-header.constants';
import { IdService } from '@/platform/ids/services/id.service';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { TEST_TELEGRAM_TOKEN } from '@test/support/constants/channel-testing.constants';
import { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import { newChannel } from '@test/support/fixtures/channel.fixture';
import { bootRoleWithEmails } from '@test/support/helpers/auth-flow.helpers';

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

describe('telegram webhook ingress', () => {
  let app: INestApplication;
  let workspaceId: string;
  let userId: string;
  let agentId: string;
  let channelId: string;
  let channelPublicId: string;
  let workspacePublicId: string;

  beforeAll(async () => {
    app = await bootRoleWithEmails(
      { role: Role.Gateway, queues: [] },
      new FakeEmailGateway(),
      TestRedisPrefix.TelegramWebhook,
    );
    const workspace = await app.get(SampleWorkspaceService).ensure();
    workspaceId = workspace.workspaceId;
    userId = workspace.userId;
    const promptRefs = await app.get(SamplePromptService).ensure(workspaceId, userId);
    await app.get(SampleAgentService).ensure(workspaceId, userId, promptRefs);
    const agents = await app
      .get(TenantTransactionService)
      .run(workspaceId, () => app.get(AgentsRepository).listPage(workspaceId, null, 10));
    const agent = agents.find((candidate) => candidate.name === SAMPLE_AGENT_NAME);
    if (agent === undefined) {
      throw new Error('The sample agent was not created.');
    }
    agentId = agent.id;
    const ids = app.get(IdService);
    const channel = newChannel(
      {
        ids,
        clock: app.get(ClockService),
        channelTokens: app.get(ChannelTokenService),
      },
      workspaceId,
      {
        createdByUserId: userId,
        agentId,
        status: ChannelStatus.Connected,
        externalId: ids.generate(),
        credentialsSealed: app.get(ChannelTokenService).sealCredentials({
          botToken: TEST_TELEGRAM_TOKEN,
          webhookSecretHash: app.get(SecureTokenService).hash(WEBHOOK_SECRET),
        }),
      },
    );
    channelId = channel.id;
    await app
      .get(TenantTransactionService)
      .run(workspaceId, () => app.get(ChannelsRepository).insertIfAbsent(channel));
    workspacePublicId = ids.toPublic(IdPrefix.Workspace, workspaceId);
    channelPublicId = ids.toPublic(IdPrefix.Channel, channelId);
  });

  afterAll(async () => {
    await app.close();
  });

  const post = (secret: string | null = WEBHOOK_SECRET) => {
    const requestBuilder = request(app.getHttpServer()).post(
      `${TELEGRAM_WEBHOOK_PATH}/${workspacePublicId}/${channelPublicId}`,
    );
    return secret === null
      ? requestBuilder.send(webhookBody())
      : requestBuilder.set(HttpHeader.TelegramSecretToken, secret).send(webhookBody());
  };

  it('accepts a webhook update with the correct secret', async () => {
    const response = await post();

    expect(response.status).toBe(200);
    const events = await app
      .get(SystemDatabaseService)
      .db.select()
      .from(channelEvents)
      .where(eq(channelEvents.channelId, channelId));
    expect(events).toHaveLength(1);
  });

  it('rejects a webhook update without the secret', async () => {
    const response = await post(null);

    expect(response.status).toBe(401);
  });

  it('rejects a webhook update with a wrong secret', async () => {
    const response = await post('wrong-secret');

    expect(response.status).toBe(401);
  });
});
