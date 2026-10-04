import { Injectable } from '@nestjs/common';
import { Registry, collectDefaultMetrics } from 'prom-client';
import { ConfigService } from '@/platform/config/services/config.service';
import { MetricLabel } from '@/platform/observability/constants/metrics.constants';

@Injectable()
export class MetricsService {
  readonly registry = new Registry();

  constructor(config: ConfigService) {
    this.registry.setDefaultLabels({ [MetricLabel.Role]: config.config.role });
    collectDefaultMetrics({ register: this.registry });
  }

  render(): Promise<string> {
    return this.registry.metrics();
  }
}
