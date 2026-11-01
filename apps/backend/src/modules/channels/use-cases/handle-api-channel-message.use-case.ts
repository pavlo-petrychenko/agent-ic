import { IdPrefix } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { ApiReplyMode, ChannelStatus } from '@/modules/channels/constants/channel.constants';
import { ChannelNotFoundError } from '@/modules/channels/errors/channel-not-found.error';
import { parseChannelInput } from '@/modules/channels/helpers/channel-input.helpers';
import { channelReplyMode } from '@/modules/channels/helpers/channel.helpers';
import { ChannelsRepository } from '@/modules/channels/repositories/channels.repository';
import { apiChannelMessageInputSchema } from '@/modules/channels/schemas/api-channel-message.schema';
import { ApiChannelRateLimiterService } from '@/modules/channels/services/api-channel-rate-limiter.service';
import { ApiChannelReplyService } from '@/modules/channels/services/api-channel-reply.service';
import type {
  ApiChannelMessageInput,
  ApiChannelMessageResult,
} from '@/modules/channels/typedefs/api-channel-ingress.typedefs';
import {
  ChannelKind,
  ConversationMode,
  IncomingMessageOutcome,
  IncomingMessagesService,
} from '@/modules/conversations';
import { MessageRunService } from '@/modules/runs';
import { ActorKind } from '@/platform/context/constants/actor.constants';
import { AuthenticationRequiredError } from '@/platform/context/errors/authentication-required.error';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class HandleApiChannelMessageUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly channels: ChannelsRepository,
    private readonly incoming: IncomingMessagesService,
    private readonly messageRuns: MessageRunService,
    private readonly replies: ApiChannelReplyService,
    private readonly rateLimiter: ApiChannelRateLimiterService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: ApiChannelMessageInput): Promise<ApiChannelMessageResult> {
    const actor = ctx.actor;
    const workspaceId = ctx.workspaceId;
    if (actor.kind !== ActorKind.ApiChannel || workspaceId === null) {
      throw new AuthenticationRequiredError();
    }

    const channel = await this.tenantTransactions.run(workspaceId, () =>
      this.channels.findById(workspaceId, actor.channelId),
    );
    if (
      channel === null ||
      channel.kind !== ChannelKind.Api ||
      channel.status !== ChannelStatus.Connected ||
      channel.agentId === null
    ) {
      throw new ChannelNotFoundError();
    }
    await this.rateLimiter.enforce(ctx, workspaceId, channel.id);
    const data = parseChannelInput(apiChannelMessageInputSchema, input.body);
    const agentId = channel.agentId;
    const idempotencyKey = input.idempotencyKey?.trim() ?? '';
    const externalId = idempotencyKey === '' ? this.ids.generate() : idempotencyKey;

    if (channelReplyMode(channel.identity) !== ApiReplyMode.Response) {
      const result = await this.incoming.handleIncomingMessage(ctx, {
        workspaceId,
        agentId,
        mode: ConversationMode.Live,
        channelKind: ChannelKind.Api,
        channelId: channel.id,
        endUserExternalId: data.user_id,
        endUserName: null,
        externalId,
        text: data.text,
        versionId: null,
      });
      return {
        conversationId: this.ids.toPublic(IdPrefix.Conversation, result.conversationId),
        reply: null,
      };
    }

    const runId = this.ids.generate();
    return this.replies.wait(workspaceId, runId, () =>
      this.tenantTransactions.run(workspaceId, async () => {
        const result = await this.incoming.handleIncomingMessage(ctx, {
          workspaceId,
          agentId,
          mode: ConversationMode.Live,
          channelKind: ChannelKind.Api,
          channelId: channel.id,
          endUserExternalId: data.user_id,
          endUserName: null,
          externalId,
          text: data.text,
          versionId: null,
          runId,
        });
        const conversationId = this.ids.toPublic(IdPrefix.Conversation, result.conversationId);
        if (result.outcome !== IncomingMessageOutcome.RunRequested || result.messageId === null) {
          return { conversationId, runStarted: false };
        }
        const run = await this.messageRuns.start(ctx, {
          workspaceId,
          conversationId: result.conversationId,
          messageId: result.messageId,
          agentId,
          mode: ConversationMode.Live,
          versionId: null,
          runId,
        });
        return { conversationId, runStarted: run !== null };
      }),
    );
  }
}
