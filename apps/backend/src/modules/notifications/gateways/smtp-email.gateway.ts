import { createTransport } from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { EmailUpstream } from '@/modules/notifications/constants/email-gateway.constants';
import { EmailGateway } from '@/modules/notifications/gateways/email.gateway';
import { smtpTransportOptions } from '@/modules/notifications/helpers/smtp-transport.helpers';
import type { EmailMessage } from '@/modules/notifications/typedefs/email.typedefs';
import type { SmtpConfig } from '@/platform/config/typedefs/app-config.typedefs';
import { UpstreamError } from '@/platform/errors/errors/upstream.error';

export class SmtpEmailGateway extends EmailGateway {
  private readonly transport: Transporter;

  constructor(
    private readonly from: string,
    smtp: SmtpConfig,
  ) {
    super();
    this.transport = createTransport(smtpTransportOptions(smtp));
  }

  async send(message: EmailMessage): Promise<void> {
    try {
      await this.transport.sendMail({
        from: this.from,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
      });
    } catch (cause) {
      throw new UpstreamError(EmailUpstream.Smtp, { retryable: true, cause });
    }
  }
}
