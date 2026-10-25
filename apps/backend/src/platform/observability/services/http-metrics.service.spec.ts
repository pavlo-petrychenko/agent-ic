import { EventEmitter } from 'node:events';
import { HttpStatus } from '@nestjs/common';
import { context, trace } from '@opentelemetry/api';
import { node } from '@opentelemetry/sdk-node';
import type { Request, Response } from 'express';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { MILLISECONDS_PER_SECOND } from '@/platform/clock/constants/time.constants';
import {
  HttpMetricLabel,
  HttpMetricName,
  RESPONSE_FINISH_EVENT,
} from '@/platform/observability/constants/http-metrics.constants';
import { HttpMetricsService } from '@/platform/observability/services/http-metrics.service';
import type { MetricsService } from '@/platform/observability/services/metrics.service';
import { ManualClock } from '@test/support/fakes/manual-clock.fake';
import { createMetricsService, metricValue } from '@test/support/helpers/llm-testing.helpers';

const START = new Date('2026-01-01T00:00:00Z');
const REQUEST_MS = 250;
const TEST_TRACER_NAME = 'http-metrics-test';

interface FakeExchange {
  readonly request: Request;
  readonly response: Response & EventEmitter;
}

const exchange = (url: string, route: { path: string } | undefined): FakeExchange => ({
  request: Object.assign(new EventEmitter(), {
    method: 'POST',
    originalUrl: url,
    baseUrl: '',
    route,
  }) as unknown as Request,
  response: Object.assign(new EventEmitter(), {
    statusCode: HttpStatus.CREATED,
  }) as unknown as Response & EventEmitter,
});

describe('HttpMetricsService', () => {
  let metrics: MetricsService;
  let clock: ManualClock;
  let service: HttpMetricsService;
  const next = vi.fn<() => void>();
  const provider = new node.NodeTracerProvider();

  beforeAll(() => provider.register());

  afterAll(async () => {
    await provider.shutdown();
    trace.disable();
    context.disable();
  });

  beforeEach(() => {
    metrics = createMetricsService();
    clock = new ManualClock(START);
    service = new HttpMetricsService(metrics, clock);
  });

  it('counts a finished request by method, route template and status class', async () => {
    const { request, response } = exchange('/api/agents/42', { path: '/api/agents/:id' });

    service.middleware(request, response, next);
    clock.advanceBy(REQUEST_MS);
    response.emit(RESPONSE_FINISH_EVENT);

    const labels = {
      [HttpMetricLabel.Method]: 'POST',
      [HttpMetricLabel.Route]: '/api/agents/:id',
      [HttpMetricLabel.StatusClass]: '2xx',
    };
    expect(await metricValue(metrics, HttpMetricName.Requests, labels)).toBe(1);
    expect(next).toHaveBeenCalled();
    expect(await metrics.render()).toContain(`${HttpMetricName.RequestDuration}_sum`);
    expect(await metricValue(metrics, HttpMetricName.RequestDuration, labels)).not.toBeNull();
  });

  it('records how long the request took', async () => {
    const { request, response } = exchange('/api/graphql', { path: '/api/graphql' });

    service.middleware(request, response, next);
    clock.advanceBy(REQUEST_MS);
    response.emit(RESPONSE_FINISH_EVENT);

    const rendered = await metrics.render();
    expect(rendered).toContain(
      `${HttpMetricName.RequestDuration}_sum{role="api",method="POST",route="/api/graphql",status_class="2xx"} ${REQUEST_MS / MILLISECONDS_PER_SECOND}`,
    );
  });

  it('ignores health and metrics requests', async () => {
    for (const url of ['/health/live', '/metrics']) {
      const { request, response } = exchange(url, { path: url });
      service.middleware(request, response, next);
      response.emit(RESPONSE_FINISH_EVENT);
    }

    expect(await metrics.render()).not.toContain(`${HttpMetricName.Requests}{`);
  });

  it('attaches the trace of a sampled request to the latency bucket', async () => {
    const { request, response } = exchange('/api/graphql', { path: '/api/graphql' });
    const { traceId, spanId } = provider
      .getTracer(TEST_TRACER_NAME)
      .startActiveSpan('request', (span) => {
        service.middleware(request, response, next);
        span.end();
        return span.spanContext();
      });

    response.emit(RESPONSE_FINISH_EVENT);

    expect(await metrics.render()).toContain(`# {trace_id="${traceId}",span_id="${spanId}"}`);
  });
});
