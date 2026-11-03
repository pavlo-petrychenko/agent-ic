import { Resolver, Subscription } from '@nestjs/graphql';
import { ConversationGraphqlField } from '@/modules/conversations/constants/conversation-graphql.constants';
import { toGraphqlInboxActivity } from '@/modules/conversations/helpers/inbox-activity-graphql.helpers';
import type { InboxActivity } from '@/modules/conversations/typedefs/inbox-activity.typedefs';
import { SubscribeToInboxActivityUseCase } from '@/modules/conversations/use-cases/subscribe-to-inbox-activity.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type { ChannelStream } from '@/platform/live-updates/typedefs/channel.typedefs';

@Resolver()
export class InboxActivityResolver {
  constructor(private readonly subscribeToInbox: SubscribeToInboxActivityUseCase) {}

  @Subscription(ConversationGraphqlField.InboxActivity, {
    resolve: toGraphqlInboxActivity,
  })
  inboxActivity(@GraphqlCtx() ctx: UseCaseCtx): Promise<ChannelStream<InboxActivity>> {
    return this.subscribeToInbox.execute(ctx);
  }
}
