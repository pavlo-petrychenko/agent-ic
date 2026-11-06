import { Injectable } from '@nestjs/common';
import {
  ConversationMode,
  ConversationState,
} from '@/modules/conversations/constants/conversation.constants';
import { MessageSystemEvent } from '@/modules/conversations/constants/message.constants';
import { ConversationTakenError } from '@/modules/conversations/errors/conversation-taken.error';
import { parseConversationInput } from '@/modules/conversations/helpers/conversation-input.helpers';
import { authorizeOperator } from '@/modules/conversations/helpers/operator.helpers';
import { takeOverSchema } from '@/modules/conversations/schemas/simulation.schema';
import { ConversationTimelineService } from '@/modules/conversations/services/conversation-timeline.service';
import { InboxActivityService } from '@/modules/conversations/services/inbox-activity.service';
import { OperatorConversationsService } from '@/modules/conversations/services/operator-conversations.service';
import { SimulationsService } from '@/modules/conversations/services/simulations.service';
import type {
  ConversationView,
  TakeOverInput,
} from '@/modules/conversations/typedefs/simulation.typedefs';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Injectable()
export class TakeOverUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly operated: OperatorConversationsService,
    private readonly inboxActivity: InboxActivityService,
    private readonly timeline: ConversationTimelineService,
    private readonly views: SimulationsService,
  ) {}

  async execute(ctx: UseCaseCtx, input: TakeOverInput): Promise<ConversationView> {
    const access = authorizeOperator(ctx);
    const { conversationId, fromOperator } = parseConversationInput(takeOverSchema, input);
    return this.tenants.run(access.workspaceId, async () => {
      const conversation = await this.operated.requireOperable(ctx, access, conversationId);
      const alreadyMine =
        conversation.state === ConversationState.Handled &&
        conversation.handledBy === access.userId;
      if (!alreadyMine && conversation.state === ConversationState.Handled && !fromOperator) {
        throw new ConversationTakenError(conversation.id);
      }
      const takenOver = await this.operated.takeOver(conversation, access.userId);
      if (conversation.mode === ConversationMode.Live && !alreadyMine) {
        await this.timeline.record(conversation, MessageSystemEvent.TookOver, access.userId);
        await this.inboxActivity.conversationChanged(access.workspaceId, conversation.id);
      }
      return this.views.conversationView(takenOver);
    });
  }
}
