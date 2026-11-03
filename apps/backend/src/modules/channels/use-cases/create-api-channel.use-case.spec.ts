import { ChannelKind, ErrorReason, IdPrefix, WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ApiReplyMode, ChannelStatus } from '@/modules/channels/constants/channel.constants';
import { InvalidChannelInputError } from '@/modules/channels/errors/invalid-channel-input.error';
import { apiChannelSecretHint } from '@/modules/channels/helpers/api-channel-secret.helpers';
import { CreateApiChannelUseCase } from '@/modules/channels/use-cases/create-api-channel.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import {
  createChannelsTestbed,
  seedChannelWorkspace,
} from '@test/support/helpers/channels-testing.helpers';
import { seedAgent } from '@test/support/helpers/conversations-testing.helpers';
import type { ChannelsTestbed } from '@test/support/typedefs/channels-testing.typedefs';

const WEBHOOK = 'https://example.com/hooks/agent';

describe('CreateApiChannelUseCase', () => {
  let testbed: ChannelsTestbed;
  let create: CreateApiChannelUseCase;

  beforeAll(async () => {
    testbed = await createChannelsTestbed();
    create = testbed.module.get(CreateApiChannelUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  const seed = async () => {
    const workspace = await seedChannelWorkspace(testbed);
    const agentId = await seedAgent(testbed, workspace.workspaceId);
    return {
      ...workspace,
      agentId,
      ctx: workspaceCtx(workspace.userId, workspace.workspaceId, WorkspaceRole.Owner),
      publicAgentId: testbed.ids.toPublic(IdPrefix.Agent, agentId),
    };
  };

  it('creates an api channel and returns its secret once', async () => {
    const { workspaceId, userId, ctx, publicAgentId } = await seed();

    const result = await create.execute(ctx, {
      name: 'Website',
      agentId: publicAgentId,
      replyMode: ApiReplyMode.Webhook,
      webhook: WEBHOOK,
    });

    expect(result.channel).toMatchObject({
      kind: ChannelKind.Api,
      status: ChannelStatus.Connected,
      displayName: 'Website',
      replyMode: ApiReplyMode.Webhook,
      webhook: WEBHOOK,
    });
    expect(result.channel.tokenMasked).toBe(apiChannelSecretHint(result.secret));
    expect(result.channel.endpoint).toContain('/v1/channels/');
    expect(result.channel.endpoint).toContain('/messages');
    expect(result.secret).not.toBe('');
    expect(result.channel.tokenMasked).toMatch(/^.{8}•+.{2}$/);

    const channelId = testbed.ids.fromPublic(IdPrefix.Channel, result.channel.id);
    const stored = await testbed.tenants.run(workspaceId, () =>
      testbed.channels.findById(workspaceId, channelId),
    );
    if (stored === null) {
      throw new Error('Expected a stored channel');
    }
    expect(stored.credentialsSealed).not.toContain(result.secret);
    expect(stored.createdByUserId).toBe(userId);
    expect(stored.updatedByUserId).toBe(userId);

    const credentials = testbed.channelTokens.openCredentials(stored.credentialsSealed);
    if (!('secretKeyHash' in credentials)) {
      throw new Error('Expected API credentials');
    }
    expect(credentials.secretKeyHash).not.toBe(result.secret);
    expect(credentials.secretKeyHint).toBe(apiChannelSecretHint(result.secret));
    expect(credentials.previousSecretKeyHash).toBeNull();
    expect(credentials.previousKeyExpiresAt).toBeNull();
  });

  it('requires a webhook when replies go to a webhook', async () => {
    const { workspaceId, ctx, publicAgentId } = await seed();

    await expect(
      create.execute(ctx, {
        name: 'Website',
        agentId: publicAgentId,
        replyMode: ApiReplyMode.Webhook,
        webhook: null,
      }),
    ).rejects.toBeInstanceOf(InvalidChannelInputError);
    await expect(
      testbed.tenants.run(workspaceId, () => testbed.channels.list(workspaceId)),
    ).resolves.toEqual([]);
  });

  it('refuses an empty name', async () => {
    const { ctx, publicAgentId } = await seed();

    await expect(
      create.execute(ctx, {
        name: '   ',
        agentId: publicAgentId,
        replyMode: ApiReplyMode.Response,
        webhook: null,
      }),
    ).rejects.toBeInstanceOf(InvalidChannelInputError);
  });

  it('refuses an agent from another workspace', async () => {
    const first = await seed();
    const second = await seed();

    await expect(
      create.execute(first.ctx, {
        name: 'Website',
        agentId: second.publicAgentId,
        replyMode: ApiReplyMode.Response,
        webhook: null,
      }),
    ).rejects.toMatchObject({ reason: ErrorReason.AgentNotFound });
  });

  it('refuses an operator', async () => {
    const { workspaceId, userId, publicAgentId } = await seed();

    await expect(
      create.execute(workspaceCtx(userId, workspaceId, WorkspaceRole.Operator), {
        name: 'Website',
        agentId: publicAgentId,
        replyMode: ApiReplyMode.Response,
        webhook: null,
      }),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
