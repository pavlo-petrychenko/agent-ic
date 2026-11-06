import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { NotificationGraphqlArgument } from '@/modules/notifications/constants/notification-graphql.constants';
import { CountUnreadNotificationsUseCase } from '@/modules/notifications/use-cases/count-unread-notifications.use-case';
import { MarkNotificationsReadUseCase } from '@/modules/notifications/use-cases/mark-notifications-read.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type { MarkNotificationsReadInput } from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class NotificationResolver {
  constructor(
    private readonly countUnread: CountUnreadNotificationsUseCase,
    private readonly markRead: MarkNotificationsReadUseCase,
  ) {}

  @Query()
  unreadNotificationCount(@GraphqlCtx() ctx: UseCaseCtx): Promise<number> {
    return this.countUnread.execute(ctx);
  }

  @Mutation()
  markNotificationsRead(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(NotificationGraphqlArgument.Input) input: MarkNotificationsReadInput,
  ): Promise<number> {
    return this.markRead.execute(ctx, { conversationId: input.conversationId });
  }
}
