import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { ConversationGraphqlArgument } from '@/modules/conversations/constants/conversation-graphql.constants';
import { toGraphqlMessage } from '@/modules/conversations/helpers/simulation-graphql.helpers';
import { ReplyAsOperatorUseCase } from '@/modules/conversations/use-cases/reply-as-operator.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  Message,
  ReplyAsOperatorInput,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class ReplyAsOperatorResolver {
  constructor(private readonly replyAsOperatorUseCase: ReplyAsOperatorUseCase) {}

  @Mutation()
  async replyAsOperator(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(ConversationGraphqlArgument.Input) input: ReplyAsOperatorInput,
  ): Promise<Message> {
    return toGraphqlMessage(await this.replyAsOperatorUseCase.execute(ctx, input));
  }
}
