import { AgentsModule } from '@/modules/agents';
import { TelegramAlertsController } from '@/modules/notifications/controllers/telegram-alerts.controller';
import { EmailGateway } from '@/modules/notifications/gateways/email.gateway';
import { createEmailGateway } from '@/modules/notifications/helpers/email-gateway.helpers';
import { SendConfirmationEmailListener } from '@/modules/notifications/listeners/send-confirmation-email.listener';
import { SendEmailChangeEmailListener } from '@/modules/notifications/listeners/send-email-change-email.listener';
import { SendPasswordResetEmailListener } from '@/modules/notifications/listeners/send-password-reset-email.listener';
import { NotificationSettingsRepository } from '@/modules/notifications/repositories/notification-settings.repository';
import { NotificationsRepository } from '@/modules/notifications/repositories/notifications.repository';
import { TelegramLinkRepository } from '@/modules/notifications/repositories/telegram-link.repository';
import { NotificationSettingsResolver } from '@/modules/notifications/resolvers/notification-settings.resolver';
import { NotificationResolver } from '@/modules/notifications/resolvers/notification.resolver';
import { NotificationMetricsService } from '@/modules/notifications/services/notification-metrics.service';
import { NotificationRecipientsService } from '@/modules/notifications/services/notification-recipients.service';
import { NotificationSettingsService } from '@/modules/notifications/services/notification-settings.service';
import { TelegramAlertsPollerService } from '@/modules/notifications/services/telegram-alerts-poller.service';
import { TelegramAlertsService } from '@/modules/notifications/services/telegram-alerts.service';
import { CountUnreadNotificationsUseCase } from '@/modules/notifications/use-cases/count-unread-notifications.use-case';
import { CreateTelegramNotificationLinkUseCase } from '@/modules/notifications/use-cases/create-telegram-notification-link.use-case';
import { GetLatestUnreadNotificationUseCase } from '@/modules/notifications/use-cases/get-latest-unread-notification.use-case';
import { GetNotificationSettingsUseCase } from '@/modules/notifications/use-cases/get-notification-settings.use-case';
import { HandleTelegramAlertsUpdateUseCase } from '@/modules/notifications/use-cases/handle-telegram-alerts-update.use-case';
import { MarkNotificationsReadUseCase } from '@/modules/notifications/use-cases/mark-notifications-read.use-case';
import { SendConfirmationEmailUseCase } from '@/modules/notifications/use-cases/send-confirmation-email.use-case';
import { SendEmailChangeEmailUseCase } from '@/modules/notifications/use-cases/send-email-change-email.use-case';
import { SendPasswordResetEmailUseCase } from '@/modules/notifications/use-cases/send-password-reset-email.use-case';
import { UnlinkTelegramNotificationUseCase } from '@/modules/notifications/use-cases/unlink-telegram-notification.use-case';
import { UpdateNotificationChannelUseCase } from '@/modules/notifications/use-cases/update-notification-channel.use-case';
import { UpdateNotificationEmailUseCase } from '@/modules/notifications/use-cases/update-notification-email.use-case';
import { ConfigService } from '@/platform/config/services/config.service';
import { defineModule } from '@/platform/module-roles/helpers/module-roles.helpers';
import { TelegramModule } from '@/platform/telegram/telegram.module';

export class NotificationsModule extends defineModule({
  global: true,
  imports: [AgentsModule, TelegramModule],
  providers: [
    {
      provide: EmailGateway,
      inject: [ConfigService, NotificationMetricsService],
      useFactory: ({ config }: ConfigService, metrics: NotificationMetricsService): EmailGateway =>
        createEmailGateway(config.email, metrics),
    },
    NotificationMetricsService,
    NotificationSettingsRepository,
    NotificationsRepository,
    TelegramLinkRepository,
    NotificationSettingsService,
    NotificationRecipientsService,
    TelegramAlertsPollerService,
    TelegramAlertsService,
    GetNotificationSettingsUseCase,
    GetLatestUnreadNotificationUseCase,
    UpdateNotificationChannelUseCase,
    UpdateNotificationEmailUseCase,
    CountUnreadNotificationsUseCase,
    CreateTelegramNotificationLinkUseCase,
    HandleTelegramAlertsUpdateUseCase,
    UnlinkTelegramNotificationUseCase,
    MarkNotificationsReadUseCase,
    SendConfirmationEmailUseCase,
    SendPasswordResetEmailUseCase,
    SendEmailChangeEmailUseCase,
  ],
  resolvers: [NotificationSettingsResolver, NotificationResolver],
  gatewayControllers: [TelegramAlertsController],
  listeners: [
    SendConfirmationEmailListener,
    SendPasswordResetEmailListener,
    SendEmailChangeEmailListener,
  ],
  exports: [
    EmailGateway,
    NotificationsRepository,
    NotificationRecipientsService,
    NotificationSettingsService,
  ],
}) {}
