import { RESEND_EMAILS_URL } from '@/modules/notifications/constants/email-gateway.constants';
import type { EmailGateway } from '@/modules/notifications/gateways/email.gateway';
import { ResendEmailGateway } from '@/modules/notifications/gateways/resend-email.gateway';
import { SmtpEmailGateway } from '@/modules/notifications/gateways/smtp-email.gateway';
import type { NotificationMetricsService } from '@/modules/notifications/services/notification-metrics.service';
import { EmailMode } from '@/platform/config/constants/email.constants';
import type { EmailConfig } from '@/platform/config/typedefs/app-config.typedefs';

export const createEmailGateway = (
  config: EmailConfig,
  metrics: NotificationMetricsService,
): EmailGateway =>
  config.mode === EmailMode.Smtp
    ? new SmtpEmailGateway(config.from, config.smtp, metrics)
    : new ResendEmailGateway(config.from, config.resend.apiKey, RESEND_EMAILS_URL, metrics);
