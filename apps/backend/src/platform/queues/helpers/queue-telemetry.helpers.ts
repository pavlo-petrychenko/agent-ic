import { context, propagation, ROOT_CONTEXT, trace } from '@opentelemetry/api';
import type { Context } from '@opentelemetry/api';
import type { Span, SpanOptions, Telemetry } from 'bullmq';
import { BullMQOtel } from 'bullmq-otel';
import { QUEUE_TRACER_NAME } from '@/platform/queues/constants/queue.constants';
import type { JobTraceContext } from '@/platform/queues/typedefs/job.typedefs';

const untracedSpan: Span<Context> = {
  setSpanOnContext: (ctx) => ctx,
  setAttribute: () => undefined,
  setAttributes: () => undefined,
  addEvent: () => undefined,
  recordException: () => undefined,
  end: () => undefined,
};

const insideTrace = (parent: Context | undefined): boolean =>
  trace.getSpan(parent ?? context.active()) !== undefined;

export const queueTelemetry = (): Telemetry<Context> => {
  const otel = new BullMQOtel({ tracerName: QUEUE_TRACER_NAME });
  return {
    tracer: {
      startSpan: (name: string, options?: SpanOptions, parent?: Context): Span<Context> =>
        insideTrace(parent) ? otel.tracer.startSpan(name, options, parent) : untracedSpan,
    },
    contextManager: {
      with: (ctx, fn) => otel.contextManager.with(ctx, fn),
      active: () => otel.contextManager.active(),
      root: () => ROOT_CONTEXT,
      getMetadata: (ctx) => otel.contextManager.getMetadata(ctx),
      fromMetadata: (active, metadata) => otel.contextManager.fromMetadata(active, metadata),
    },
  };
};

export const currentTraceContext = (): JobTraceContext => {
  const carrier: Record<string, string> = {};
  propagation.inject(context.active(), carrier);
  return carrier;
};

export const traceContextOf = (carrier: JobTraceContext): Context =>
  propagation.extract(ROOT_CONTEXT, carrier);
