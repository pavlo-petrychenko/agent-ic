import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { ConversationGraphqlArgument } from '@/modules/conversations/constants/conversation-graphql.constants';
import { toGraphqlConversation } from '@/modules/conversations/helpers/simulation-graphql.helpers';
import { TakeOverUseCase } from '@/modules/conversations/use-cases/take-over.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  Conversation,
  TakeOverInput,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class TakeOverResolver {
  constructor(private readonly takeOverUseCase: TakeOverUseCase) {}
  @Mutation()
  async takeOver(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(ConversationGraphqlArgument.Input) input: TakeOverInput,
  ): Promise<Conversation> {
    return toGraphqlConversation(await this.takeOverUseCase.execute(ctx, input));
  }
}
