import { Args, Query, Resolver } from '@nestjs/graphql';
import { ConversationGraphqlArgument } from '@/modules/conversations/constants/conversation-graphql.constants';
import { toGraphqlInboxDetail } from '@/modules/conversations/helpers/inbox-graphql.helpers';
import type { InboxConversationDetailParent } from '@/modules/conversations/typedefs/inbox-graphql.typedefs';
import { GetInboxConversationUseCase } from '@/modules/conversations/use-cases/get-inbox-conversation.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type { InboxConversationInput } from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class InboxConversationResolver {
  constructor(private readonly getInbox: GetInboxConversationUseCase) {}

  @Query()
  async inboxConversation(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(ConversationGraphqlArgument.Input) input: InboxConversationInput,
  ): Promise<InboxConversationDetailParent> {
    return toGraphqlInboxDetail(await this.getInbox.execute(ctx, input));
  }
}
