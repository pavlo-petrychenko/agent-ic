import { Injectable } from '@nestjs/common';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { Counter, Histogram } from 'prom-client';
import { MILLISECONDS_PER_SECOND } from '@/platform/clock/constants/time.constants';
import { ClockService } from '@/platform/clock/services/clock.service';
import {
  HttpMetricHelp,
  HttpMetricLabel,
  HttpMetricName,
  RESPONSE_FINISH_EVENT,
} from '@/platform/observability/constants/http-metrics.constants';
import { LATENCY_BUCKETS_SECONDS } from '@/platform/observability/constants/metrics.constants';
import {
  activeExemplarLabels,
  observeWithExemplar,
} from '@/platform/observability/helpers/exemplar.helpers';
import {
  routeTemplateOf,
  statusClassOf,
} from '@/platform/observability/helpers/http-metrics.helpers';
import { isOperationalUrl } from '@/platform/observability/helpers/operational-url.helpers';
import { MetricsService } from '@/platform/observability/services/metrics.service';
import type { ExemplarLabels } from '@/platform/observability/typedefs/metrics.typedefs';

@Injectable()
export class HttpMetricsService {
  private readonly requests: Counter<HttpMetricLabel>;
  private readonly requestDuration: Histogram<HttpMetricLabel>;

  readonly middleware: RequestHandler = (
    request: Request,
    response: Response,
    next: NextFunction,
  ): void => {
    if (!isOperationalUrl(request.originalUrl)) {
      const startedAt = this.clock.now().getTime();
      const exemplar = activeExemplarLabels();
      response.once(RESPONSE_FINISH_EVENT, () =>
        this.record(request, response.statusCode, startedAt, exemplar),
      );
    }
    next();
  };

  constructor(
    metrics: MetricsService,
    private readonly clock: ClockService,
  ) {
    const registers = [metrics.registry];
    const labelNames = [HttpMetricLabel.Method, HttpMetricLabel.Route, HttpMetricLabel.StatusClass];
    this.requests = new Counter({
      name: HttpMetricName.Requests,
      help: HttpMetricHelp.Requests,
      labelNames,
      registers,
    });
    this.requestDuration = new Histogram({
      name: HttpMetricName.RequestDuration,
      help: HttpMetricHelp.RequestDuration,
      labelNames,
      buckets: [...LATENCY_BUCKETS_SECONDS],
      enableExemplars: true,
      registers,
    });
  }

  private record(
    request: Request,
    status: number,
    startedAt: number,
    exemplar: ExemplarLabels | undefined,
  ): void {
    const labels = {
      [HttpMetricLabel.Method]: request.method,
      [HttpMetricLabel.Route]: routeTemplateOf(request),
      [HttpMetricLabel.StatusClass]: statusClassOf(status),
    };
    const seconds = (this.clock.now().getTime() - startedAt) / MILLISECONDS_PER_SECOND;
    this.requests.inc(labels);
    observeWithExemplar(this.requestDuration, labels, seconds, exemplar);
  }
}
