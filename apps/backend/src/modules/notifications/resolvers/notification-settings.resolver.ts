import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { NotificationGraphqlArgument } from '@/modules/notifications/constants/notification-graphql.constants';
import {
  toGraphqlNotificationAlert,
  toGraphqlNotificationSettings,
  toUpdateNotificationChannelInput,
  toUpdateNotificationEmailInput,
} from '@/modules/notifications/helpers/notification-settings-graphql.helpers';
import { GetLatestUnreadNotificationUseCase } from '@/modules/notifications/use-cases/get-latest-unread-notification.use-case';
import { GetNotificationSettingsUseCase } from '@/modules/notifications/use-cases/get-notification-settings.use-case';
import { UpdateNotificationChannelUseCase } from '@/modules/notifications/use-cases/update-notification-channel.use-case';
import { UpdateNotificationEmailUseCase } from '@/modules/notifications/use-cases/update-notification-email.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  NotificationAlert as GraphqlNotificationAlert,
  NotificationSettings as GraphqlNotificationSettings,
  UpdateNotificationChannelInput as GraphqlUpdateNotificationChannelInput,
  UpdateNotificationEmailInput as GraphqlUpdateNotificationEmailInput,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class NotificationSettingsResolver {
  constructor(
    private readonly getSettings: GetNotificationSettingsUseCase,
    private readonly updateChannel: UpdateNotificationChannelUseCase,
    private readonly updateEmail: UpdateNotificationEmailUseCase,
    private readonly getLatestUnread: GetLatestUnreadNotificationUseCase,
  ) {}

  @Query()
  async notificationSettings(@GraphqlCtx() ctx: UseCaseCtx): Promise<GraphqlNotificationSettings> {
    return toGraphqlNotificationSettings(await this.getSettings.execute(ctx));
  }

  @Query()
  async latestUnreadNotification(
    @GraphqlCtx() ctx: UseCaseCtx,
  ): Promise<GraphqlNotificationAlert | null> {
    const alert = await this.getLatestUnread.execute(ctx);
    return alert === null ? null : toGraphqlNotificationAlert(alert);
  }

  @Mutation()
  async updateNotificationChannel(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(NotificationGraphqlArgument.Input) input: GraphqlUpdateNotificationChannelInput,
  ): Promise<GraphqlNotificationSettings> {
    return toGraphqlNotificationSettings(
      await this.updateChannel.execute(ctx, toUpdateNotificationChannelInput(input)),
    );
  }

  @Mutation()
  async updateNotificationEmail(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(NotificationGraphqlArgument.Input) input: GraphqlUpdateNotificationEmailInput,
  ): Promise<GraphqlNotificationSettings> {
    return toGraphqlNotificationSettings(
      await this.updateEmail.execute(ctx, toUpdateNotificationEmailInput(input)),
    );
  }
}
