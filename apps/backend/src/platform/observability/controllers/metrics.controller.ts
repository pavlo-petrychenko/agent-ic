import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import {
  CONTENT_TYPE_HEADER,
  MetricsRoute,
} from '@/platform/observability/constants/metrics.constants';
import { MetricsService } from '@/platform/observability/services/metrics.service';

@Controller(MetricsRoute.Path)
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get()
  render(@Res({ passthrough: true }) response: Response): Promise<string> {
    response.setHeader(CONTENT_TYPE_HEADER, this.metrics.contentType);
    return this.metrics.render();
  }
}
