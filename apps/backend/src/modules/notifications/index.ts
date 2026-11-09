export { NAME_PLACEHOLDER } from '@/modules/notifications/constants/action-email.constants';
export {
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationKind,
} from '@/modules/notifications/constants/notification.constants';
export { NotificationEventName } from '@/modules/notifications/constants/notification-event.constants';
export { NotificationJobName } from '@/modules/notifications/constants/notification-job.constants';
export { NotificationLogMessage } from '@/modules/notifications/constants/notification-log.constants';
export { TELEGRAM_ALERT_TAKE_OVER_COPY } from '@/modules/notifications/constants/telegram-alert.constants';
export { EmailTemplate } from '@/modules/notifications/constants/notification-metrics.constants';
export { telegramAlertTakeOverRequestedEvent } from '@/modules/notifications/events/telegram-alert-take-over-requested.event';
export type { TelegramAlertTakeOverInput } from '@/modules/notifications/events/telegram-alert-take-over-requested.event';
export { TelegramAlertsNotConfiguredError } from '@/modules/notifications/errors/telegram-alerts-not-configured.error';
export { EmailGateway } from '@/modules/notifications/gateways/email.gateway';
export { actionEmailElement } from '@/modules/notifications/helpers/action-email.helpers';
export { renderEmail } from '@/modules/notifications/helpers/email-render.helpers';
export {
  escalationEmailElement,
  escalationEmailSubject,
} from '@/modules/notifications/helpers/escalation-email.helpers';
export {
  escalationTelegramReplyMarkup,
  escalationTelegramText,
} from '@/modules/notifications/helpers/escalation-telegram.helpers';
export { telegramTakeOverCallbackData } from '@/modules/notifications/helpers/telegram-alert-callback.helpers';
export { NotificationsModule } from '@/modules/notifications/notifications.module';
export { NotificationsRepository } from '@/modules/notifications/repositories/notifications.repository';
export { NotificationRecipientsService } from '@/modules/notifications/services/notification-recipients.service';
export { NotificationSettingsService } from '@/modules/notifications/services/notification-settings.service';
export type {
  ActionEmailCopy,
  EmailMessage,
  EscalationEmailProps,
} from '@/modules/notifications/typedefs/email.typedefs';
export type {
  NotificationDeliveryRecord,
  NotificationRecord,
} from '@/modules/notifications/typedefs/notification.typedefs';
