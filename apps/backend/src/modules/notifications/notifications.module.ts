import { EmailGateway } from '@/modules/notifications/gateways/email.gateway';
import { createEmailGateway } from '@/modules/notifications/helpers/email-gateway.helpers';
import { SendConfirmationEmailListener } from '@/modules/notifications/listeners/send-confirmation-email.listener';
import { SendEmailChangeEmailListener } from '@/modules/notifications/listeners/send-email-change-email.listener';
import { SendPasswordResetEmailListener } from '@/modules/notifications/listeners/send-password-reset-email.listener';
import { NotificationSettingsRepository } from '@/modules/notifications/repositories/notification-settings.repository';
import { NotificationSettingsResolver } from '@/modules/notifications/resolvers/notification-settings.resolver';
import { NotificationMetricsService } from '@/modules/notifications/services/notification-metrics.service';
import { NotificationSettingsService } from '@/modules/notifications/services/notification-settings.service';
import { GetNotificationSettingsUseCase } from '@/modules/notifications/use-cases/get-notification-settings.use-case';
import { SendConfirmationEmailUseCase } from '@/modules/notifications/use-cases/send-confirmation-email.use-case';
import { SendEmailChangeEmailUseCase } from '@/modules/notifications/use-cases/send-email-change-email.use-case';
import { SendPasswordResetEmailUseCase } from '@/modules/notifications/use-cases/send-password-reset-email.use-case';
import { UpdateNotificationChannelUseCase } from '@/modules/notifications/use-cases/update-notification-channel.use-case';
import { UpdateNotificationEmailUseCase } from '@/modules/notifications/use-cases/update-notification-email.use-case';
import { ConfigService } from '@/platform/config/services/config.service';
import { defineModule } from '@/platform/module-roles/helpers/module-roles.helpers';

export class NotificationsModule extends defineModule({
  global: true,
  providers: [
    {
      provide: EmailGateway,
      inject: [ConfigService, NotificationMetricsService],
      useFactory: ({ config }: ConfigService, metrics: NotificationMetricsService): EmailGateway =>
        createEmailGateway(config.email, metrics),
    },
    NotificationMetricsService,
    NotificationSettingsRepository,
    NotificationSettingsService,
    GetNotificationSettingsUseCase,
    UpdateNotificationChannelUseCase,
    UpdateNotificationEmailUseCase,
    SendConfirmationEmailUseCase,
    SendPasswordResetEmailUseCase,
    SendEmailChangeEmailUseCase,
  ],
  resolvers: [NotificationSettingsResolver],
  listeners: [
    SendConfirmationEmailListener,
    SendPasswordResetEmailListener,
    SendEmailChangeEmailListener,
  ],
  exports: [EmailGateway],
}) {}
