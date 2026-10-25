import { TraceFlags, isSpanContextValid, trace } from '@opentelemetry/api';
import type { Histogram, LabelValues } from 'prom-client';
import { ExemplarLabel } from '@/platform/observability/constants/metrics.constants';
import type { ExemplarLabels } from '@/platform/observability/typedefs/metrics.typedefs';

export const activeExemplarLabels = (): ExemplarLabels | undefined => {
  const span = trace.getActiveSpan()?.spanContext();
  if (span === undefined || !isSpanContextValid(span)) {
    return undefined;
  }
  if ((span.traceFlags & TraceFlags.SAMPLED) === 0) {
    return undefined;
  }
  return { [ExemplarLabel.TraceId]: span.traceId, [ExemplarLabel.SpanId]: span.spanId };
};

export const observeWithExemplar = (
  histogram: Histogram,
  labels: LabelValues<string>,
  value: number,
  exemplar: ExemplarLabels | undefined,
): void => {
  histogram.observe({ labels, value, exemplarLabels: exemplar });
};
