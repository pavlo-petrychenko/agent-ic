import { Injectable } from '@nestjs/common';
import { Counter } from 'prom-client';
import type { EmailUpstream } from '@/modules/notifications/constants/email-gateway.constants';
import {
  EmailSendOutcome,
  NotificationMetricHelp,
  NotificationMetricLabel,
  NotificationMetricName,
} from '@/modules/notifications/constants/notification-metrics.constants';
import type { EmailTemplate } from '@/modules/notifications/constants/notification-metrics.constants';
import { MetricsService } from '@/platform/observability/services/metrics.service';

@Injectable()
export class NotificationMetricsService {
  private readonly emailSends: Counter<NotificationMetricLabel>;

  constructor(metrics: MetricsService) {
    this.emailSends = new Counter({
      name: NotificationMetricName.EmailSends,
      help: NotificationMetricHelp.EmailSends,
      labelNames: [
        NotificationMetricLabel.Gateway,
        NotificationMetricLabel.Template,
        NotificationMetricLabel.Outcome,
      ],
      registers: [metrics.registry],
    });
  }

  async trackEmail(
    gateway: EmailUpstream,
    template: EmailTemplate,
    send: () => Promise<void>,
  ): Promise<void> {
    let outcome = EmailSendOutcome.Failed;
    try {
      await send();
      outcome = EmailSendOutcome.Sent;
    } finally {
      this.emailSends.inc({
        [NotificationMetricLabel.Gateway]: gateway,
        [NotificationMetricLabel.Template]: template,
        [NotificationMetricLabel.Outcome]: outcome,
      });
    }
  }
}
