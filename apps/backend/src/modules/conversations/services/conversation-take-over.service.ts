import { Injectable } from '@nestjs/common';
import {
  ConversationMode,
  ConversationState,
} from '@/modules/conversations/constants/conversation.constants';
import { MessageSystemEvent } from '@/modules/conversations/constants/message.constants';
import { ConversationsRepository } from '@/modules/conversations/repositories/conversations.repository';
import { ConversationTimelineService } from '@/modules/conversations/services/conversation-timeline.service';
import { InboxActivityService } from '@/modules/conversations/services/inbox-activity.service';
import { OperatorConversationsService } from '@/modules/conversations/services/operator-conversations.service';
import { SimulationsService } from '@/modules/conversations/services/simulations.service';
import type { ConversationView } from '@/modules/conversations/typedefs/simulation.typedefs';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import type { WorkspaceAccess } from '@/platform/context/typedefs/workspace-access.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Injectable()
export class ConversationTakeOverService {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly operated: OperatorConversationsService,
    private readonly conversations: ConversationsRepository,
    private readonly inboxActivity: InboxActivityService,
    private readonly timeline: ConversationTimelineService,
    private readonly views: SimulationsService,
  ) {}

  async takeOver(
    ctx: UseCaseCtx,
    access: WorkspaceAccess,
    conversationPublicId: string,
  ): Promise<ConversationView> {
    return this.tenants.run(access.workspaceId, async () => {
      const conversation = await this.operated.requireOperable(ctx, access, conversationPublicId);
      const takenOver = await this.conversations.takeOver(
        access.workspaceId,
        conversation.id,
        access.userId,
      );
      if (takenOver !== null && conversation.mode === ConversationMode.Live) {
        if (
          conversation.state !== ConversationState.Handled ||
          conversation.handledBy !== access.userId
        ) {
          await this.timeline.record(conversation, MessageSystemEvent.TookOver, access.userId);
        }
        await this.inboxActivity.conversationChanged(access.workspaceId, conversation.id);
      }
      return this.views.conversationView(takenOver ?? conversation);
    });
  }
}
