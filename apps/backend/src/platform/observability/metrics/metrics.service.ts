import { Injectable } from '@nestjs/common';
import { Registry, collectDefaultMetrics } from 'prom-client';

import { ConfigService } from '@/platform/config/config.service';

import { MetricLabel } from './metrics.constants';

@Injectable()
export class MetricsService {
  private readonly registry = new Registry();

  constructor(config: ConfigService) {
    this.registry.setDefaultLabels({ [MetricLabel.Role]: config.config.role });
    collectDefaultMetrics({ register: this.registry });
  }

  render(): Promise<string> {
    return this.registry.metrics();
  }
}
