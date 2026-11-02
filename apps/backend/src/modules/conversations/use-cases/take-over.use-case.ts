import { Injectable } from '@nestjs/common';
import { ConversationMode } from '@/modules/conversations/constants/conversation.constants';
import { parseConversationInput } from '@/modules/conversations/helpers/conversation-input.helpers';
import { authorizeOperator } from '@/modules/conversations/helpers/operator.helpers';
import { ConversationsRepository } from '@/modules/conversations/repositories/conversations.repository';
import { operatorConversationSchema } from '@/modules/conversations/schemas/simulation.schema';
import { InboxActivityService } from '@/modules/conversations/services/inbox-activity.service';
import { OperatorConversationsService } from '@/modules/conversations/services/operator-conversations.service';
import { SimulationsService } from '@/modules/conversations/services/simulations.service';
import type {
  ConversationView,
  OperatorConversationInput,
} from '@/modules/conversations/typedefs/simulation.typedefs';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Injectable()
export class TakeOverUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly operated: OperatorConversationsService,
    private readonly conversations: ConversationsRepository,
    private readonly inboxActivity: InboxActivityService,
    private readonly views: SimulationsService,
  ) {}

  async execute(ctx: UseCaseCtx, input: OperatorConversationInput): Promise<ConversationView> {
    const access = authorizeOperator(ctx);
    const { conversationId } = parseConversationInput(operatorConversationSchema, input);
    return this.tenants.run(access.workspaceId, async () => {
      const conversation = await this.operated.requireOperable(ctx, access, conversationId);
      const takenOver = await this.conversations.takeOver(
        access.workspaceId,
        conversation.id,
        access.userId,
      );
      if (takenOver !== null && conversation.mode === ConversationMode.Live) {
        await this.inboxActivity.conversationUpdated(access.workspaceId, conversation.id);
      }
      return this.views.conversationView(takenOver ?? conversation);
    });
  }
}
