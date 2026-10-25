import { Injectable } from '@nestjs/common';
import { Counter } from 'prom-client';
import {
  LiveUpdatesMetricHelp,
  LiveUpdatesMetricLabel,
  LiveUpdatesMetricName,
} from '@/platform/live-updates/constants/live-updates-metrics.constants';
import { MetricsService } from '@/platform/observability/services/metrics.service';

@Injectable()
export class LiveUpdatesMetricsService {
  private readonly published: Counter<LiveUpdatesMetricLabel>;

  constructor(metrics: MetricsService) {
    this.published = new Counter({
      name: LiveUpdatesMetricName.EventsPublished,
      help: LiveUpdatesMetricHelp.EventsPublished,
      labelNames: [LiveUpdatesMetricLabel.Channel],
      registers: [metrics.registry],
    });
  }

  eventPublished(channelName: string): void {
    this.published.inc({ [LiveUpdatesMetricLabel.Channel]: channelName });
  }
}
