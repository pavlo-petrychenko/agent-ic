import { ChannelKind, IdPrefix } from '@agent-ic/contracts';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ApiReplyMode, ChannelStatus } from '@/modules/channels/constants/channel.constants';
import { ChannelsRepository } from '@/modules/channels/repositories/channels.repository';
import { ChannelTokenService } from '@/modules/channels/services/channel-token.service';
import { MessagesRepository } from '@/modules/conversations/repositories/messages.repository';
import { FakeEmailGateway } from '@/modules/notifications/gateways/email.fake';
import { ClockService } from '@/platform/clock/services/clock.service';
import { SecureTokenService } from '@/platform/crypto/services/secure-token.service';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { HttpHeader } from '@/platform/http/constants/http-header.constants';
import { IdService } from '@/platform/ids/services/id.service';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import type { ManualClock } from '@test/support/fakes/manual-clock.fake';
import { newChannel } from '@test/support/fixtures/channel.fixture';
import { bootRoleWithEmails } from '@test/support/helpers/auth-flow.helpers';
import {
  ensureAgentRow,
  ensureUserRow,
  ensureWorkspaceRow,
} from '@test/support/helpers/parent-rows.helpers';

const MESSAGE_PATH = '/v1/channels';
const USER_ID = 'cust_1';
const TEXT = 'Do you ship to Poland?';
const IDEMPOTENCY_KEY = 'request-1';

describe('api channel message ingress', () => {
  let app: INestApplication;
  let workspaceId: string;
  let channelPublicId: string;
  let secret: string;

  beforeAll(async () => {
    app = await bootRoleWithEmails(
      { role: Role.Gateway, queues: [] },
      new FakeEmailGateway(),
      TestRedisPrefix.ApiChannelIngress,
    );
    const ids = app.get(IdService);
    const clock = app.get(ClockService) as ManualClock;
    const channelTokens = app.get(ChannelTokenService);
    const secureTokens = app.get(SecureTokenService);
    workspaceId = ids.generate();
    const userId = ids.generate();
    const agentId = ids.generate();
    await ensureWorkspaceRow(app, workspaceId);
    await ensureUserRow(app, userId);
    await ensureAgentRow(app, workspaceId, agentId);

    const generated = secureTokens.generate();
    secret = generated.token;
    const channel = newChannel({ ids, clock, channelTokens }, workspaceId, {
      createdByUserId: userId,
      kind: ChannelKind.Api,
      status: ChannelStatus.Connected,
      agentId,
      identity: { name: 'Website', replyMode: ApiReplyMode.Response, webhook: null },
      showTyping: false,
      credentialsSealed: channelTokens.sealCredentials({
        secretKeyHash: generated.hash,
        secretKeyHint: 'hint',
        previousSecretKeyHash: null,
        previousKeyExpiresAt: null,
      }),
    });
    await app
      .get(TenantTransactionService)
      .run(workspaceId, () => app.get(ChannelsRepository).insertIfAbsent(channel));
    channelPublicId = ids.toPublic(IdPrefix.Channel, channel.id);
  });

  afterAll(async () => {
    await app.close();
  });

  const post = (key: string | null = secret) => {
    const builder = request(app.getHttpServer())
      .post(`${MESSAGE_PATH}/${channelPublicId}/messages`)
      .set(HttpHeader.IdempotencyKey, IDEMPOTENCY_KEY)
      .send({ user_id: USER_ID, text: TEXT });
    return key === null ? builder : builder.set(HttpHeader.Authorization, `Bearer ${key}`);
  };

  it('accepts a message with the channel key', async () => {
    const response = await post();

    expect(response.status).toBe(202);
    expect(response.body.conversation_id).toMatch(/^cnv_/);
  });

  it('rejects a missing key', async () => {
    const response = await post(null);

    expect(response.status).toBe(401);
  });

  it('rejects a wrong key', async () => {
    const response = await post('wrong-key');

    expect(response.status).toBe(401);
  });

  it('rejects an unknown channel', async () => {
    const unknown = app.get(IdService).toPublic(IdPrefix.Channel, app.get(IdService).generate());
    const response = await request(app.getHttpServer())
      .post(`${MESSAGE_PATH}/${unknown}/messages`)
      .set(HttpHeader.Authorization, `Bearer ${secret}`)
      .send({ user_id: USER_ID, text: TEXT });

    expect(response.status).toBe(404);
  });

  it('does not duplicate a retried message with the same idempotency key', async () => {
    const first = await post();
    const second = await post();

    expect(first.status).toBe(202);
    expect(second.status).toBe(202);
    expect(second.body.conversation_id).toBe(first.body.conversation_id);
    const publicConversationId = first.body.conversation_id as string;
    const conversationId = app
      .get(IdService)
      .fromPublic(IdPrefix.Conversation, publicConversationId);
    const messages = await app
      .get(TenantTransactionService)
      .run(workspaceId, () =>
        app.get(MessagesRepository).listByConversation(workspaceId, conversationId),
      );
    expect(messages).toHaveLength(1);
  });
});
