export { NAME_PLACEHOLDER } from '@/modules/notifications/constants/action-email.constants';
export { EmailTemplate } from '@/modules/notifications/constants/notification-metrics.constants';
export { EmailGateway } from '@/modules/notifications/gateways/email.gateway';
export { actionEmailElement } from '@/modules/notifications/helpers/action-email.helpers';
export { renderEmail } from '@/modules/notifications/helpers/email-render.helpers';
export { NotificationsModule } from '@/modules/notifications/notifications.module';
export type {
  ActionEmailCopy,
  EmailMessage,
} from '@/modules/notifications/typedefs/email.typedefs';
