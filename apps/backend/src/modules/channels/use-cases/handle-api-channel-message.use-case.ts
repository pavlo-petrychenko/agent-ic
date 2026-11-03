import { IdPrefix } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { ChannelStatus } from '@/modules/channels/constants/channel.constants';
import { ChannelNotFoundError } from '@/modules/channels/errors/channel-not-found.error';
import { parseChannelInput } from '@/modules/channels/helpers/channel-input.helpers';
import { ChannelsRepository } from '@/modules/channels/repositories/channels.repository';
import { apiChannelMessageInputSchema } from '@/modules/channels/schemas/api-channel-message.schema';
import type {
  ApiChannelMessageInput,
  ApiChannelMessageResult,
} from '@/modules/channels/typedefs/api-channel-ingress.typedefs';
import { ChannelKind, ConversationMode, IncomingMessagesService } from '@/modules/conversations';
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
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: ApiChannelMessageInput): Promise<ApiChannelMessageResult> {
    const actor = ctx.actor;
    const workspaceId = ctx.workspaceId;
    if (actor.kind !== ActorKind.ApiChannel || workspaceId === null) {
      throw new AuthenticationRequiredError();
    }

    const data = parseChannelInput(apiChannelMessageInputSchema, input.body);
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

    const idempotencyKey = input.idempotencyKey?.trim() ?? '';
    const result = await this.incoming.handleIncomingMessage(ctx, {
      workspaceId,
      agentId: channel.agentId,
      mode: ConversationMode.Live,
      channelKind: ChannelKind.Api,
      channelId: channel.id,
      endUserExternalId: data.user_id,
      endUserName: null,
      externalId: idempotencyKey === '' ? this.ids.generate() : idempotencyKey,
      text: data.text,
      versionId: null,
    });

    return {
      conversationId: this.ids.toPublic(IdPrefix.Conversation, result.conversationId),
    };
  }
}
