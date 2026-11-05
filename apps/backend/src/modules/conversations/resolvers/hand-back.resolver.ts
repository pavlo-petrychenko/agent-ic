import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { ConversationGraphqlArgument } from '@/modules/conversations/constants/conversation-graphql.constants';
import { toGraphqlConversation } from '@/modules/conversations/helpers/simulation-graphql.helpers';
import { HandBackUseCase } from '@/modules/conversations/use-cases/hand-back.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  Conversation,
  HandBackInput,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class HandBackResolver {
  constructor(private readonly handBackUseCase: HandBackUseCase) {}

  @Mutation()
  async handBack(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(ConversationGraphqlArgument.Input) input: HandBackInput,
  ): Promise<Conversation> {
    return toGraphqlConversation(await this.handBackUseCase.execute(ctx, input));
  }
}
