import { Injectable } from '@nestjs/common';
import { parseConversationInput } from '@/modules/conversations/helpers/conversation-input.helpers';
import { authorizeOperator } from '@/modules/conversations/helpers/operator.helpers';
import { takeOverSchema } from '@/modules/conversations/schemas/simulation.schema';
import { ConversationTakeOverService } from '@/modules/conversations/services/conversation-take-over.service';
import type {
  ConversationView,
  TakeOverInput,
} from '@/modules/conversations/typedefs/simulation.typedefs';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';

@Injectable()
export class TakeOverUseCase {
  constructor(private readonly takeOvers: ConversationTakeOverService) {}

  async execute(ctx: UseCaseCtx, input: TakeOverInput): Promise<ConversationView> {
    const access = authorizeOperator(ctx);
    const { conversationId, fromOperator } = parseConversationInput(takeOverSchema, input);
    return this.takeOvers.takeOver(ctx, access, conversationId, fromOperator);
  }
}
