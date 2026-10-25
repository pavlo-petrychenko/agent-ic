import { describe, expect, it } from 'vitest';
import { ResendEmailGateway } from '@/modules/notifications/gateways/resend-email.gateway';
import { SmtpEmailGateway } from '@/modules/notifications/gateways/smtp-email.gateway';
import { createEmailGateway } from '@/modules/notifications/helpers/email-gateway.helpers';
import { NotificationMetricsService } from '@/modules/notifications/services/notification-metrics.service';
import { EmailMode } from '@/platform/config/constants/email.constants';
import { createMetricsService } from '@test/support/helpers/llm-testing.helpers';

const FROM = 'agent-ic <no-reply@agent-ic.test>';
const metrics = new NotificationMetricsService(createMetricsService());

describe('createEmailGateway', () => {
  it('sends through SMTP in smtp mode', () => {
    const gateway = createEmailGateway(
      {
        mode: EmailMode.Smtp,
        from: FROM,
        smtp: {
          host: '127.0.0.1',
          port: 1025,
          secure: false,
          requireTls: false,
          credentials: null,
        },
      },
      metrics,
    );

    expect(gateway).toBeInstanceOf(SmtpEmailGateway);
  });

  it('sends through Resend in resend mode', () => {
    const gateway = createEmailGateway(
      {
        mode: EmailMode.Resend,
        from: FROM,
        resend: { apiKey: 're_test_key' },
      },
      metrics,
    );

    expect(gateway).toBeInstanceOf(ResendEmailGateway);
  });
});
