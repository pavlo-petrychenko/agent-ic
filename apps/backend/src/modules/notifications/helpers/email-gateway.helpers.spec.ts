import { describe, expect, it } from 'vitest';
import { ResendEmailGateway } from '@/modules/notifications/gateways/resend-email.gateway';
import { SmtpEmailGateway } from '@/modules/notifications/gateways/smtp-email.gateway';
import { createEmailGateway } from '@/modules/notifications/helpers/email-gateway.helpers';
import { EmailMode } from '@/platform/config/constants/email.constants';

const FROM = 'agent-ic <no-reply@agent-ic.test>';

describe('createEmailGateway', () => {
  it('sends through SMTP in smtp mode', () => {
    const gateway = createEmailGateway({
      mode: EmailMode.Smtp,
      from: FROM,
      smtp: { host: '127.0.0.1', port: 1025 },
    });

    expect(gateway).toBeInstanceOf(SmtpEmailGateway);
  });

  it('sends through Resend in resend mode', () => {
    const gateway = createEmailGateway({
      mode: EmailMode.Resend,
      from: FROM,
      resend: { apiKey: 're_test_key' },
    });

    expect(gateway).toBeInstanceOf(ResendEmailGateway);
  });
});
