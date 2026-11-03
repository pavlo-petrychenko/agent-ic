import { Args, Query, Resolver } from '@nestjs/graphql';
import { ConversationGraphqlArgument } from '@/modules/conversations/constants/conversation-graphql.constants';
import { toGraphqlInboxSummary } from '@/modules/conversations/helpers/inbox-graphql.helpers';
import { ListInboxConversationsUseCase } from '@/modules/conversations/use-cases/list-inbox-conversations.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  InboxConversationsInput,
  InboxConversationSummary,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class InboxConversationsResolver {
  constructor(private readonly listInbox: ListInboxConversationsUseCase) {}

  @Query()
  async inboxConversations(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(ConversationGraphqlArgument.Input) input: InboxConversationsInput,
  ): Promise<InboxConversationSummary[]> {
    const summaries = await this.listInbox.execute(ctx, input);
    return summaries.map(toGraphqlInboxSummary);
  }
}
