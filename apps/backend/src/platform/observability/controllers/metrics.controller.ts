import { Controller, Get, Header } from '@nestjs/common';
import { Registry } from 'prom-client';
import {
  CONTENT_TYPE_HEADER,
  MetricsRoute,
} from '@/platform/observability/constants/metrics.constants';
import { MetricsService } from '@/platform/observability/services/metrics.service';

@Controller(MetricsRoute.Path)
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get()
  @Header(CONTENT_TYPE_HEADER, Registry.PROMETHEUS_CONTENT_TYPE)
  render(): Promise<string> {
    return this.metrics.render();
  }
}
