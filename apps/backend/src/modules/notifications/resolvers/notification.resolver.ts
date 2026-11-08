import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { NotificationGraphqlArgument } from '@/modules/notifications/constants/notification-graphql.constants';
import { toGraphqlNotificationConnection } from '@/modules/notifications/helpers/notification-list-graphql.helpers';
import { CountUnreadNotificationsUseCase } from '@/modules/notifications/use-cases/count-unread-notifications.use-case';
import { ListNotificationsUseCase } from '@/modules/notifications/use-cases/list-notifications.use-case';
import { MarkAllNotificationsReadUseCase } from '@/modules/notifications/use-cases/mark-all-notifications-read.use-case';
import { MarkNotificationReadUseCase } from '@/modules/notifications/use-cases/mark-notification-read.use-case';
import { MarkNotificationsReadUseCase } from '@/modules/notifications/use-cases/mark-notifications-read.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  MarkNotificationReadInput,
  MarkNotificationsReadInput,
  NotificationConnection,
  QueryNotificationsArgs,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class NotificationResolver {
  constructor(
    private readonly countUnread: CountUnreadNotificationsUseCase,
    private readonly listNotifications: ListNotificationsUseCase,
    private readonly markRead: MarkNotificationReadUseCase,
    private readonly markAllRead: MarkAllNotificationsReadUseCase,
    private readonly markConversationRead: MarkNotificationsReadUseCase,
  ) {}

  @Query()
  unreadNotificationCount(@GraphqlCtx() ctx: UseCaseCtx): Promise<number> {
    return this.countUnread.execute(ctx);
  }

  @Query()
  async notifications(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(NotificationGraphqlArgument.First) first: QueryNotificationsArgs['first'],
    @Args(NotificationGraphqlArgument.After) after: QueryNotificationsArgs['after'],
    @Args(NotificationGraphqlArgument.UnreadOnly) unreadOnly: QueryNotificationsArgs['unreadOnly'],
  ): Promise<NotificationConnection> {
    return toGraphqlNotificationConnection(
      await this.listNotifications.execute(ctx, { first, after, unreadOnly }),
    );
  }

  @Mutation()
  markNotificationRead(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(NotificationGraphqlArgument.Input) input: MarkNotificationReadInput,
  ): Promise<number> {
    return this.markRead.execute(ctx, { notificationId: input.notificationId });
  }

  @Mutation()
  markAllNotificationsRead(@GraphqlCtx() ctx: UseCaseCtx): Promise<number> {
    return this.markAllRead.execute(ctx);
  }

  @Mutation()
  markNotificationsRead(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(NotificationGraphqlArgument.Input) input: MarkNotificationsReadInput,
  ): Promise<number> {
    return this.markConversationRead.execute(ctx, { conversationId: input.conversationId });
  }
}
