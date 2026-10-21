import { Injectable } from '@nestjs/common';
import { Counter } from 'prom-client';
import {
  UsageMetricHelp,
  UsageMetricName,
} from '@/modules/usage/constants/usage-metrics.constants';
import { MetricsService } from '@/platform/observability/services/metrics.service';

@Injectable()
export class UsageMetricsService {
  private readonly reportFailures: Counter;

  constructor(metrics: MetricsService) {
    this.reportFailures = new Counter({
      name: UsageMetricName.ReportFailures,
      help: UsageMetricHelp.ReportFailures,
      registers: [metrics.registry],
    });
  }

  reportFailed(): void {
    this.reportFailures.inc();
  }
}
