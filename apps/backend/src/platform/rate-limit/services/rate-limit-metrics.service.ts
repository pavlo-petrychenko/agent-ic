import { Injectable } from '@nestjs/common';
import { Counter } from 'prom-client';
import { MetricsService } from '@/platform/observability/services/metrics.service';
import {
  RateLimitMetricHelp,
  RateLimitMetricLabel,
  RateLimitMetricName,
} from '@/platform/rate-limit/constants/rate-limit-metrics.constants';

@Injectable()
export class RateLimitMetricsService {
  private readonly rejections: Counter<RateLimitMetricLabel>;

  constructor(metrics: MetricsService) {
    this.rejections = new Counter({
      name: RateLimitMetricName.Rejections,
      help: RateLimitMetricHelp.Rejections,
      labelNames: [RateLimitMetricLabel.Policy],
      registers: [metrics.registry],
    });
  }

  rejected(policy: string): void {
    this.rejections.inc({ [RateLimitMetricLabel.Policy]: policy });
  }
}
