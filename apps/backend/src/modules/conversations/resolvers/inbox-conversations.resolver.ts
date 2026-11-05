import { Args, Query, Resolver } from '@nestjs/graphql';
import { ConversationGraphqlArgument } from '@/modules/conversations/constants/conversation-graphql.constants';
import { toGraphqlInboxSummary } from '@/modules/conversations/helpers/inbox-graphql.helpers';
import type { InboxSummaryParent } from '@/modules/conversations/typedefs/inbox-graphql.typedefs';
import { GetInboxNeedsYouCountUseCase } from '@/modules/conversations/use-cases/get-inbox-needs-you-count.use-case';
import { ListInboxConversationsUseCase } from '@/modules/conversations/use-cases/list-inbox-conversations.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type { InboxConversationsInput } from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class InboxConversationsResolver {
  constructor(
    private readonly listInbox: ListInboxConversationsUseCase,
    private readonly getNeedsYouCount: GetInboxNeedsYouCountUseCase,
  ) {}

  @Query()
  async inboxConversations(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(ConversationGraphqlArgument.Input) input: InboxConversationsInput,
  ): Promise<InboxSummaryParent[]> {
    const summaries = await this.listInbox.execute(ctx, input);
    return summaries.map(toGraphqlInboxSummary);
  }

  @Query()
  inboxNeedsYouCount(@GraphqlCtx() ctx: UseCaseCtx): Promise<number> {
    return this.getNeedsYouCount.execute(ctx);
  }
}
