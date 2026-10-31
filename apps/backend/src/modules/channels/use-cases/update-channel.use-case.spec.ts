import { ChannelKind, IdPrefix, WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ApiReplyMode, ChannelStatus } from '@/modules/channels/constants/channel.constants';
import { ChannelNotFoundError } from '@/modules/channels/errors/channel-not-found.error';
import { InvalidChannelInputError } from '@/modules/channels/errors/invalid-channel-input.error';
import { UpdateChannelUseCase } from '@/modules/channels/use-cases/update-channel.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { TEST_WORKSPACE_OWNER_NAME } from '@test/support/constants/workspace-testing.constants';
import { newChannel } from '@test/support/fixtures/channel.fixture';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import {
  createChannelsTestbed,
  seedApiChannel,
  seedChannelWorkspace,
} from '@test/support/helpers/channels-testing.helpers';
import { seedAgent } from '@test/support/helpers/conversations-testing.helpers';
import type { ChannelsTestbed } from '@test/support/typedefs/channels-testing.typedefs';

const WEBHOOK = 'https://example.com/hooks/agent';

describe('UpdateChannelUseCase', () => {
  let testbed: ChannelsTestbed;
  let update: UpdateChannelUseCase;

  beforeAll(async () => {
    testbed = await createChannelsTestbed();
    update = testbed.module.get(UpdateChannelUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  const seedTelegram = async () => {
    const workspace = await seedChannelWorkspace(testbed);
    const agentId = await seedAgent(testbed, workspace.workspaceId);
    const nextAgentId = await seedAgent(testbed, workspace.workspaceId);
    const channel = newChannel(testbed, workspace.workspaceId, {
      createdByUserId: workspace.userId,
      status: ChannelStatus.Connected,
      agentId,
    });
    await testbed.tenants.run(workspace.workspaceId, () =>
      testbed.channels.insertIfAbsent(channel),
    );
    return {
      ...workspace,
      agentId,
      nextAgentId,
      channel,
      ctx: workspaceCtx(workspace.userId, workspace.workspaceId, WorkspaceRole.Owner),
    };
  };

  const publicIds = (seeded: {
    readonly channel: { readonly id: string };
    readonly agentId: string;
  }) => ({
    id: testbed.ids.toPublic(IdPrefix.Channel, seeded.channel.id),
    agentId: testbed.ids.toPublic(IdPrefix.Agent, seeded.agentId),
  });

  it('updates a telegram channel agent and typing setting', async () => {
    const seeded = await seedTelegram();
    const { id } = publicIds(seeded);

    const view = await update.execute(seeded.ctx, {
      id,
      agentId: testbed.ids.toPublic(IdPrefix.Agent, seeded.nextAgentId),
      showTyping: false,
      replyMode: null,
      webhook: null,
    });

    expect(view).toMatchObject({
      kind: ChannelKind.Telegram,
      status: ChannelStatus.Connected,
      agentId: testbed.ids.toPublic(IdPrefix.Agent, seeded.nextAgentId),
      showTyping: false,
      updatedByName: TEST_WORKSPACE_OWNER_NAME,
    });
    const stored = await testbed.tenants.run(seeded.workspaceId, () =>
      testbed.channels.findById(seeded.workspaceId, seeded.channel.id),
    );
    expect(stored?.agentId).toBe(seeded.nextAgentId);
    expect(stored?.updatedByUserId).toBe(seeded.userId);
  });

  it('refuses api settings on a telegram channel', async () => {
    const seeded = await seedTelegram();
    const { id, agentId } = publicIds(seeded);

    await expect(
      update.execute(seeded.ctx, {
        id,
        agentId,
        showTyping: true,
        replyMode: ApiReplyMode.Response,
        webhook: null,
      }),
    ).rejects.toBeInstanceOf(InvalidChannelInputError);
  });

  it('refuses a telegram update without showTyping', async () => {
    const seeded = await seedTelegram();
    const { id, agentId } = publicIds(seeded);

    await expect(
      update.execute(seeded.ctx, {
        id,
        agentId,
        showTyping: null,
        replyMode: null,
        webhook: null,
      }),
    ).rejects.toBeInstanceOf(InvalidChannelInputError);
  });

  it('updates an api channel agent, typing setting, reply mode and webhook', async () => {
    const seeded = await seedApiChannel(testbed);
    const { id } = publicIds(seeded);
    const nextAgentId = await seedAgent(testbed, seeded.workspaceId);

    const view = await update.execute(seeded.ctx, {
      id,
      agentId: testbed.ids.toPublic(IdPrefix.Agent, nextAgentId),
      showTyping: true,
      replyMode: ApiReplyMode.Webhook,
      webhook: WEBHOOK,
    });

    expect(view).toMatchObject({
      id,
      kind: ChannelKind.Api,
      status: ChannelStatus.Connected,
      agentId: testbed.ids.toPublic(IdPrefix.Agent, nextAgentId),
      showTyping: true,
      replyMode: ApiReplyMode.Webhook,
      webhook: WEBHOOK,
      tokenMasked: 'old…hash',
    });
    expect(view.endpoint).toContain(`/v1/channels/${id}/messages`);

    const stored = await testbed.tenants.run(seeded.workspaceId, () =>
      testbed.channels.findById(seeded.workspaceId, seeded.channel.id),
    );
    expect(stored?.identity).toMatchObject({
      name: 'Website',
      replyMode: ApiReplyMode.Webhook,
      webhook: WEBHOOK,
    });
    expect(stored?.agentId).toBe(nextAgentId);
    expect(stored?.showTyping).toBe(true);
  });

  it('refuses an api update without showTyping', async () => {
    const seeded = await seedApiChannel(testbed);
    const { id, agentId } = publicIds(seeded);

    await expect(
      update.execute(seeded.ctx, {
        id,
        agentId,
        showTyping: null,
        replyMode: ApiReplyMode.Response,
        webhook: null,
      }),
    ).rejects.toBeInstanceOf(InvalidChannelInputError);
  });

  it('requires a webhook when an api channel replies through one', async () => {
    const seeded = await seedApiChannel(testbed);
    const { id, agentId } = publicIds(seeded);

    await expect(
      update.execute(seeded.ctx, {
        id,
        agentId,
        showTyping: true,
        replyMode: ApiReplyMode.Webhook,
        webhook: null,
      }),
    ).rejects.toBeInstanceOf(InvalidChannelInputError);
  });

  it('refuses a channel from another workspace', async () => {
    const first = await seedTelegram();
    const second = await seedTelegram();

    await expect(
      update.execute(first.ctx, {
        id: testbed.ids.toPublic(IdPrefix.Channel, second.channel.id),
        agentId: testbed.ids.toPublic(IdPrefix.Agent, second.agentId),
        showTyping: true,
        replyMode: null,
        webhook: null,
      }),
    ).rejects.toBeInstanceOf(ChannelNotFoundError);
  });

  it('refuses an operator', async () => {
    const seeded = await seedApiChannel(testbed);
    const { id, agentId } = publicIds(seeded);

    await expect(
      update.execute(workspaceCtx(seeded.userId, seeded.workspaceId, WorkspaceRole.Operator), {
        id,
        agentId,
        showTyping: true,
        replyMode: ApiReplyMode.Response,
        webhook: null,
      }),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
