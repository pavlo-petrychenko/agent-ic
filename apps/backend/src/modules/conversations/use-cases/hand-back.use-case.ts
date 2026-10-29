import { Injectable } from '@nestjs/common';
import {
  CONVERSATION_EVENT_EMIT_OPTIONS,
  ConversationEventName,
} from '@/modules/conversations/constants/conversation-event.constants';
import { handedBackEvent } from '@/modules/conversations/events/handed-back.event';
import { parseConversationInput } from '@/modules/conversations/helpers/conversation-input.helpers';
import { authorizeOperator } from '@/modules/conversations/helpers/operator.helpers';
import { ConversationsRepository } from '@/modules/conversations/repositories/conversations.repository';
import { operatorConversationSchema } from '@/modules/conversations/schemas/simulation.schema';
import { OperatorConversationsService } from '@/modules/conversations/services/operator-conversations.service';
import { SimulationsService } from '@/modules/conversations/services/simulations.service';
import type {
  ConversationView,
  OperatorConversationInput,
} from '@/modules/conversations/typedefs/simulation.typedefs';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { DomainEventsService } from '@/platform/domain-events/services/domain-events.service';

@Injectable()
export class HandBackUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly operated: OperatorConversationsService,
    private readonly conversations: ConversationsRepository,
    private readonly views: SimulationsService,
    private readonly domainEvents: DomainEventsService,
  ) {}

  async execute(ctx: UseCaseCtx, input: OperatorConversationInput): Promise<ConversationView> {
    const access = authorizeOperator(ctx);
    const { conversationId } = parseConversationInput(operatorConversationSchema, input);
    return this.tenants.run(access.workspaceId, async () => {
      const conversation = await this.operated.requireOperable(ctx, access, conversationId);
      const handedBack = await this.conversations.handBack(access.workspaceId, conversation.id);
      if (handedBack === null) {
        return this.views.conversationView(conversation);
      }
      await this.domainEvents.emit(
        ctx,
        handedBackEvent,
        {
          conversationId: handedBack.id,
          agentId: handedBack.agentId,
          mode: handedBack.mode,
        },
        CONVERSATION_EVENT_EMIT_OPTIONS[ConversationEventName.HandedBack],
      );
      return this.views.conversationView(handedBack);
    });
  }
}
