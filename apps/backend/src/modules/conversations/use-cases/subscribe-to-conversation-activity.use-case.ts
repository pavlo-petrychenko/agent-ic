import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { conversationActivityChannel } from '@/modules/conversations/channels/conversation-activity.channel';
import { ConversationMode } from '@/modules/conversations/constants/conversation.constants';
import { ConversationNotFoundError } from '@/modules/conversations/errors/conversation-not-found.error';
import { ConversationsRepository } from '@/modules/conversations/repositories/conversations.repository';
import type {
  ConversationActivity,
  ConversationActivityInput,
} from '@/modules/conversations/typedefs/conversation-activity.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import { mapChannelStream } from '@/platform/live-updates/helpers/channel-stream.helpers';
import { channelFor } from '@/platform/live-updates/helpers/channel.helpers';
import { LiveUpdatesService } from '@/platform/live-updates/services/live-updates.service';
import type { ChannelStream } from '@/platform/live-updates/typedefs/channel.typedefs';

@Injectable()
export class SubscribeToConversationActivityUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly conversations: ConversationsRepository,
    private readonly liveUpdates: LiveUpdatesService,
    private readonly ids: IdService,
  ) {}

  async execute(
    ctx: UseCaseCtx,
    input: ConversationActivityInput,
  ): Promise<ChannelStream<ConversationActivity>> {
    const { workspaceId } = authorize(ctx, PermissionResource.Testing, PermissionAction.View);
    const conversationId = this.ids.fromPublic(IdPrefix.Conversation, input.conversationId);
    await this.tenants.run(workspaceId, async () => {
      const conversation = await this.conversations.findById(workspaceId, conversationId);
      if (conversation?.mode !== ConversationMode.Simulation) {
        throw new ConversationNotFoundError(input.conversationId);
      }
    });
    const events = await this.liveUpdates.subscribe(
      channelFor(conversationActivityChannel, conversationId),
    );
    return mapChannelStream(events, (event) => ({
      conversationId: input.conversationId,
      kind: event.kind,
      messageId:
        event.messageId === null ? null : this.ids.toPublic(IdPrefix.Message, event.messageId),
      runId: event.runId === null ? null : this.ids.toPublic(IdPrefix.Run, event.runId),
    }));
  }
}
