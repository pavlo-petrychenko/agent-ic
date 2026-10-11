import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { ConversationGraphqlArgument } from '@/modules/conversations/constants/conversation-graphql.constants';
import {
  toGraphqlConversation,
  toGraphqlMessage,
} from '@/modules/conversations/helpers/simulation-graphql.helpers';
import { HandBackUseCase } from '@/modules/conversations/use-cases/hand-back.use-case';
import { ReplyAsOperatorUseCase } from '@/modules/conversations/use-cases/reply-as-operator.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  Conversation,
  HandBackInput,
  Message,
  ReplyAsOperatorInput,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class OperatorResolver {
  constructor(
    private readonly replyAsOperatorUseCase: ReplyAsOperatorUseCase,
    private readonly handBackUseCase: HandBackUseCase,
  ) {}

  @Mutation()
  async replyAsOperator(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(ConversationGraphqlArgument.Input) input: ReplyAsOperatorInput,
  ): Promise<Message> {
    return toGraphqlMessage(await this.replyAsOperatorUseCase.execute(ctx, input));
  }

  @Mutation()
  async handBack(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(ConversationGraphqlArgument.Input) input: HandBackInput,
  ): Promise<Conversation> {
    return toGraphqlConversation(await this.handBackUseCase.execute(ctx, input));
  }
}
