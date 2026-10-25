import {
  BEARER_PREFIX,
  EmailUpstream,
  RESEND_CONTENT_TYPE,
} from '@/modules/notifications/constants/email-gateway.constants';
import { EmailGateway } from '@/modules/notifications/gateways/email.gateway';
import type { NotificationMetricsService } from '@/modules/notifications/services/notification-metrics.service';
import type {
  EmailMessage,
  ResendEmailRequest,
} from '@/modules/notifications/typedefs/email.typedefs';
import { UpstreamError } from '@/platform/errors/errors/upstream.error';
import { HttpHeader } from '@/platform/http/constants/http-header.constants';

export class ResendEmailGateway extends EmailGateway {
  constructor(
    private readonly from: string,
    private readonly apiKey: string,
    private readonly url: string,
    private readonly metrics: NotificationMetricsService,
  ) {
    super();
  }

  send(message: EmailMessage): Promise<void> {
    return this.metrics.trackEmail(EmailUpstream.Resend, message.template, () =>
      this.deliver(message),
    );
  }

  private async deliver(message: EmailMessage): Promise<void> {
    const request: ResendEmailRequest = {
      from: this.from,
      to: [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
    };
    const response = await fetch(this.url, {
      method: 'POST',
      headers: {
        [HttpHeader.Authorization]: `${BEARER_PREFIX}${this.apiKey}`,
        [HttpHeader.ContentType]: RESEND_CONTENT_TYPE,
      },
      body: JSON.stringify(request),
    }).catch((cause: unknown) => {
      throw new UpstreamError(EmailUpstream.Resend, { retryable: true, cause });
    });
    if (!response.ok) {
      throw UpstreamError.fromStatus(EmailUpstream.Resend, response.status);
    }
  }
}
