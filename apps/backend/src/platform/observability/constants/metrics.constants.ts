import { Registry } from 'prom-client';

export enum MetricsRoute {
  Path = 'metrics',
}

export enum MetricLabel {
  Role = 'role',
}

export enum ExemplarLabel {
  TraceId = 'trace_id',
  SpanId = 'span_id',
}

export const CONTENT_TYPE_HEADER = 'Content-Type';
export const METRICS_CONTENT_TYPE = Registry.OPENMETRICS_CONTENT_TYPE;
export const LATENCY_BUCKETS_SECONDS: readonly number[] = [
  0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10,
];
