import { Args, Query, Resolver } from '@nestjs/graphql';
import { ConversationGraphqlArgument } from '@/modules/conversations/constants/conversation-graphql.constants';
import {
  toGraphqlInboxSummary,
  toInboxConversationsInput,
  toInboxCountsInput,
} from '@/modules/conversations/helpers/inbox-graphql.helpers';
import type { InboxSummaryParent } from '@/modules/conversations/typedefs/inbox-graphql.typedefs';
import type { InboxFilterOptions } from '@/modules/conversations/typedefs/inbox.typedefs';
import { GetInboxCountsUseCase } from '@/modules/conversations/use-cases/get-inbox-counts.use-case';
import { GetInboxFilterOptionsUseCase } from '@/modules/conversations/use-cases/get-inbox-filter-options.use-case';
import { GetInboxNeedsYouCountUseCase } from '@/modules/conversations/use-cases/get-inbox-needs-you-count.use-case';
import { ListInboxConversationsUseCase } from '@/modules/conversations/use-cases/list-inbox-conversations.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  InboxConversationsInput,
  InboxCounts,
  InboxCountsInput,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class InboxConversationsResolver {
  constructor(
    private readonly listInbox: ListInboxConversationsUseCase,
    private readonly getNeedsYouCount: GetInboxNeedsYouCountUseCase,
    private readonly getCounts: GetInboxCountsUseCase,
    private readonly getFilterOptions: GetInboxFilterOptionsUseCase,
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
  inboxCounts(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(ConversationGraphqlArgument.Input) input: InboxCountsInput | null,
  ): Promise<InboxCounts> {
    return this.getCounts.execute(ctx, toInboxCountsInput(input));
  }

  @Query()
  inboxFilterOptions(@GraphqlCtx() ctx: UseCaseCtx): Promise<InboxFilterOptions> {
    return this.getFilterOptions.execute(ctx);
  }
}
