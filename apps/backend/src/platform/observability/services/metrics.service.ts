import { Injectable } from '@nestjs/common';
import { Registry, collectDefaultMetrics } from 'prom-client';
import type { OpenMetricsContentType } from 'prom-client';
import { ConfigService } from '@/platform/config/services/config.service';
import {
  METRICS_CONTENT_TYPE,
  MetricLabel,
} from '@/platform/observability/constants/metrics.constants';

@Injectable()
export class MetricsService {
  readonly registry = new Registry<OpenMetricsContentType>();

  constructor(config: ConfigService) {
    this.registry.setContentType(METRICS_CONTENT_TYPE);
    this.registry.setDefaultLabels({ [MetricLabel.Role]: config.config.role });
    collectDefaultMetrics({ register: this.registry });
  }

  get contentType(): string {
    return this.registry.contentType;
  }

  render(): Promise<string> {
    return this.registry.metrics();
  }
}
