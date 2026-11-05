import { Args, Query, Resolver } from '@nestjs/graphql';
import { ConversationGraphqlArgument } from '@/modules/conversations/constants/conversation-graphql.constants';
import {
  toGraphqlInboxSummary,
  toInboxConversationsInput,
} from '@/modules/conversations/helpers/inbox-graphql.helpers';
import type { InboxSummaryParent } from '@/modules/conversations/typedefs/inbox-graphql.typedefs';
import { GetInboxCountsUseCase } from '@/modules/conversations/use-cases/get-inbox-counts.use-case';
import { GetInboxNeedsYouCountUseCase } from '@/modules/conversations/use-cases/get-inbox-needs-you-count.use-case';
import { ListInboxConversationsUseCase } from '@/modules/conversations/use-cases/list-inbox-conversations.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  InboxConversationsInput,
  InboxCounts,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class InboxConversationsResolver {
  constructor(
    private readonly listInbox: ListInboxConversationsUseCase,
    private readonly getNeedsYouCount: GetInboxNeedsYouCountUseCase,
    private readonly getCounts: GetInboxCountsUseCase,
  ) {}

  @Query()
  async inboxConversations(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(ConversationGraphqlArgument.Input) input: InboxConversationsInput,
  ): Promise<InboxSummaryParent[]> {
    const summaries = await this.listInbox.execute(ctx, toInboxConversationsInput(input));
    return summaries.map(toGraphqlInboxSummary);
  }

  @Query()
  inboxNeedsYouCount(@GraphqlCtx() ctx: UseCaseCtx): Promise<number> {
    return this.getNeedsYouCount.execute(ctx);
  }

  @Query()
  inboxCounts(@GraphqlCtx() ctx: UseCaseCtx): Promise<InboxCounts> {
    return this.getCounts.execute(ctx);
  }
}
