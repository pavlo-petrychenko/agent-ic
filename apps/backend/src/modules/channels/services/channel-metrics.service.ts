import { Injectable } from '@nestjs/common';
import { Counter } from 'prom-client';
import {
  ChannelMetricHelp,
  ChannelMetricLabel,
  ChannelMetricName,
} from '@/modules/channels/constants/channel-metrics.constants';
import type { ChannelSendOutcome } from '@/modules/channels/constants/channel-metrics.constants';
import type { ChannelKind } from '@/modules/conversations';
import { MetricsService } from '@/platform/observability/services/metrics.service';

@Injectable()
export class ChannelMetricsService {
  private readonly sent: Counter<ChannelMetricLabel>;

  constructor(metrics: MetricsService) {
    this.sent = new Counter({
      name: ChannelMetricName.MessagesSent,
      help: ChannelMetricHelp.MessagesSent,
      labelNames: [ChannelMetricLabel.ChannelType, ChannelMetricLabel.Outcome],
      registers: [metrics.registry],
    });
  }

  messageSent(channelKind: ChannelKind, outcome: ChannelSendOutcome): void {
    this.sent.inc({
      [ChannelMetricLabel.ChannelType]: channelKind,
      [ChannelMetricLabel.Outcome]: outcome,
    });
  }
}
