import { context, trace } from '@opentelemetry/api';
import { node } from '@opentelemetry/sdk-node';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ExemplarLabel } from '@/platform/observability/constants/metrics.constants';
import { activeExemplarLabels } from '@/platform/observability/helpers/exemplar.helpers';

const TEST_TRACER_NAME = 'exemplar-test';

describe('activeExemplarLabels', () => {
  const provider = new node.NodeTracerProvider();

  beforeAll(() => provider.register());

  afterAll(async () => {
    await provider.shutdown();
    trace.disable();
    context.disable();
  });

  it('names the trace and span of a sampled request', () => {
    provider.getTracer(TEST_TRACER_NAME).startActiveSpan('request', (span) => {
      const { traceId, spanId } = span.spanContext();

      expect(activeExemplarLabels()).toEqual({
        [ExemplarLabel.TraceId]: traceId,
        [ExemplarLabel.SpanId]: spanId,
      });
      span.end();
    });
  });

  it('has no exemplar outside a span', () => {
    expect(activeExemplarLabels()).toBeUndefined();
  });
});
