import { Args, Resolver, Subscription } from '@nestjs/graphql';
import {
  ConversationGraphqlArgument,
  ConversationGraphqlField,
} from '@/modules/conversations/constants/conversation-activity.constants';
import { toGraphqlConversationActivity } from '@/modules/conversations/helpers/conversation-activity-graphql.helpers';
import type { ConversationActivity } from '@/modules/conversations/typedefs/conversation-activity.typedefs';
import { SubscribeToConversationActivityUseCase } from '@/modules/conversations/use-cases/subscribe-to-conversation-activity.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type { ChannelStream } from '@/platform/live-updates/typedefs/channel.typedefs';

@Resolver()
export class ConversationActivityResolver {
  constructor(private readonly subscribeUseCase: SubscribeToConversationActivityUseCase) {}

  @Subscription(ConversationGraphqlField.ConversationActivity, {
    resolve: toGraphqlConversationActivity,
  })
  conversationActivity(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(ConversationGraphqlArgument.ConversationId) conversationId: string,
  ): Promise<ChannelStream<ConversationActivity>> {
    return this.subscribeUseCase.execute(ctx, { conversationId });
  }
}
