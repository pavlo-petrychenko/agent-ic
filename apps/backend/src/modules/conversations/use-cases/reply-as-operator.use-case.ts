import { Injectable } from '@nestjs/common';
import { MessageAuthor } from '@/modules/conversations/constants/message.constants';
import { parseConversationInput } from '@/modules/conversations/helpers/conversation-input.helpers';
import {
  authorizeOperator,
  operatorMessageKey,
} from '@/modules/conversations/helpers/operator.helpers';
import { ConversationsRepository } from '@/modules/conversations/repositories/conversations.repository';
import { operatorReplySchema } from '@/modules/conversations/schemas/simulation.schema';
import { ConversationRunsService } from '@/modules/conversations/services/conversation-runs.service';
import { OperatorConversationsService } from '@/modules/conversations/services/operator-conversations.service';
import { SimulationsService } from '@/modules/conversations/services/simulations.service';
import type {
  MessageView,
  OperatorReplyInput,
} from '@/modules/conversations/typedefs/simulation.typedefs';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class ReplyAsOperatorUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly operated: OperatorConversationsService,
    private readonly conversations: ConversationsRepository,
    private readonly outbound: ConversationRunsService,
    private readonly views: SimulationsService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: OperatorReplyInput): Promise<MessageView> {
    const access = authorizeOperator(ctx);
    const { conversationId, text } = parseConversationInput(operatorReplySchema, input);
    const { workspaceId, userId } = access;
    return this.tenants.run(workspaceId, async () => {
      const conversation = await this.operated.requireOperable(ctx, access, conversationId);
      await this.conversations.takeOver(workspaceId, conversation.id, userId);
      const message = await this.outbound.recordOutbound(ctx, {
        workspaceId,
        conversationId: conversation.id,
        key: operatorMessageKey(this.ids.generate()),
        author: MessageAuthor.Operator,
        text,
        quickReplies: [],
        runId: null,
      });
      return this.views.messageView(message);
    });
  }
}
