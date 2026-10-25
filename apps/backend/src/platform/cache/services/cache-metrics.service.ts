import { Injectable } from '@nestjs/common';
import { Counter } from 'prom-client';
import {
  CacheMetricHelp,
  CacheMetricLabel,
  CacheMetricName,
} from '@/platform/cache/constants/cache-metrics.constants';
import type { CacheResult } from '@/platform/cache/constants/cache-metrics.constants';
import { MetricsService } from '@/platform/observability/services/metrics.service';

@Injectable()
export class CacheMetricsService {
  private readonly requests: Counter<CacheMetricLabel>;

  constructor(metrics: MetricsService) {
    this.requests = new Counter({
      name: CacheMetricName.Requests,
      help: CacheMetricHelp.Requests,
      labelNames: [CacheMetricLabel.Entry, CacheMetricLabel.Result],
      registers: [metrics.registry],
    });
  }

  requested(entry: string, result: CacheResult): void {
    this.requests.inc({ [CacheMetricLabel.Entry]: entry, [CacheMetricLabel.Result]: result });
  }
}
