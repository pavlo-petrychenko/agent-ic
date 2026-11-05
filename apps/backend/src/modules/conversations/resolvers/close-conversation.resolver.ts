import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { ConversationGraphqlArgument } from '@/modules/conversations/constants/conversation-graphql.constants';
import { toGraphqlConversation } from '@/modules/conversations/helpers/simulation-graphql.helpers';
import { CloseConversationUseCase } from '@/modules/conversations/use-cases/close-conversation.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  CloseConversationInput,
  Conversation,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class CloseConversationResolver {
  constructor(private readonly closeConversationUseCase: CloseConversationUseCase) {}

  @Mutation()
  async closeConversation(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(ConversationGraphqlArgument.Input) input: CloseConversationInput,
  ): Promise<Conversation> {
    return toGraphqlConversation(await this.closeConversationUseCase.execute(ctx, input));
  }
}
