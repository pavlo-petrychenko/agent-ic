import { Injectable } from '@nestjs/common';
import { CloseReason } from '@/modules/conversations/constants/conversation.constants';
import { MessageAuthor } from '@/modules/conversations/constants/message.constants';
import { parseConversationInput } from '@/modules/conversations/helpers/conversation-input.helpers';
import {
  authorizeOperator,
  operatorMessageKey,
} from '@/modules/conversations/helpers/operator.helpers';
import { ConversationsRepository } from '@/modules/conversations/repositories/conversations.repository';
import { closeConversationSchema } from '@/modules/conversations/schemas/simulation.schema';
import { ConversationRunsService } from '@/modules/conversations/services/conversation-runs.service';
import { OperatorConversationsService } from '@/modules/conversations/services/operator-conversations.service';
import { SimulationsService } from '@/modules/conversations/services/simulations.service';
import type {
  CloseConversationInput,
  ConversationView,
} from '@/modules/conversations/typedefs/simulation.typedefs';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class CloseConversationUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly operated: OperatorConversationsService,
    private readonly conversations: ConversationsRepository,
    private readonly outbound: ConversationRunsService,
    private readonly views: SimulationsService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: CloseConversationInput): Promise<ConversationView> {
    const access = authorizeOperator(ctx);
    const { conversationId, message } = parseConversationInput(closeConversationSchema, input);
    return this.tenants.run(access.workspaceId, async () => {
      const conversation = await this.operated.requireOperable(ctx, access, conversationId);
      if (message !== null) {
        await this.outbound.recordOutbound(ctx, {
          workspaceId: access.workspaceId,
          conversationId: conversation.id,
          key: operatorMessageKey(this.ids.generate()),
          author: MessageAuthor.Operator,
          authorUserId: access.userId,
          text: message,
          quickReplies: [],
          runId: null,
        });
      }
      await this.outbound.close(access.workspaceId, conversation.id, CloseReason.ClosedByOperator);
      const closed = await this.conversations.findById(access.workspaceId, conversation.id);
      return this.views.conversationView(closed ?? conversation);
    });
  }
}
