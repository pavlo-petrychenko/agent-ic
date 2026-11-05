import { randomUUID } from 'node:crypto';
import { TransactionHost } from '@nestjs-cls/transactional';
import type { INestApplication } from '@nestjs/common';
import { context, propagation, SpanKind, trace } from '@opentelemetry/api';
import type { SpanContext } from '@opentelemetry/api';
import { node, tracing } from '@opentelemetry/sdk-node';
import type { Queue } from 'bullmq';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { MILLISECONDS_PER_SECOND } from '@/platform/clock/constants/time.constants';
import { ClockService } from '@/platform/clock/services/clock.service';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';
import { OUTBOX_GRACE_PERIOD_SECONDS } from '@/platform/queues/constants/outbox.constants';
import { QueueName } from '@/platform/queues/constants/queue.constants';
import { JobsService } from '@/platform/queues/services/jobs.service';
import { OutboxSweeperService } from '@/platform/queues/services/outbox-sweeper.service';
import { QueuesService } from '@/platform/queues/services/queues.service';
import type { JobEnvelope } from '@/platform/queues/typedefs/job.typedefs';
import {
  DURABLE_JOBS_TEST_START,
  PROBE_TRACE_ID,
  PROBE_WAIT_INTERVAL_MS,
  PROBE_WAIT_TIMEOUT_MS,
} from '@test/support/constants/async-jobs.constants';
import { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import { ManualClock } from '@test/support/fakes/manual-clock.fake';
import { createProbeWorker, userCtx } from '@test/support/helpers/async-jobs.helpers';
import { flakyProbeJob } from '@test/support/jobs/flaky-probe.job';
import { recordProbeJob } from '@test/support/jobs/record-probe.job';
import { ProbeCallsRecorderService } from '@test/support/services/probe-calls-recorder.service';

class ProbeOutage extends Error {}

const WAIT = { timeout: PROBE_WAIT_TIMEOUT_MS, interval: PROBE_WAIT_INTERVAL_MS };
const DURABLE = { durable: true };
const PAST_GRACE_MS = (OUTBOX_GRACE_PERIOD_SECONDS + 1) * MILLISECONDS_PER_SECOND;
const TEST_TRACER_NAME = 'job-tracing-test';
const REQUEST_SPAN_NAME = 'POST /graphql';
const SWEEP_SPAN_NAME = 'sweep';

describe('job tracing', () => {
  const exporter = new tracing.InMemorySpanExporter();
  const provider = new node.NodeTracerProvider({
    spanProcessors: [new tracing.SimpleSpanProcessor(exporter)],
  });
  const tracer = provider.getTracer(TEST_TRACER_NAME);
  let app: INestApplication;
  let txHost: TransactionHost<AppTransactionAdapter>;
  let jobs: JobsService;
  let sweeper: OutboxSweeperService;
  let clock: ManualClock;
  let recorder: ProbeCallsRecorderService;
  let queue: Queue<JobEnvelope>;

  const inSpan = (name: string, work: () => Promise<unknown>): Promise<SpanContext> =>
    tracer.startActiveSpan(name, async (span) => {
      try {
        await work();
        return span.spanContext();
      } finally {
        span.end();
      }
    });

  const spansOf = (traceId: string, kind: SpanKind): tracing.ReadableSpan[] =>
    exporter
      .getFinishedSpans()
      .filter((span) => span.spanContext().traceId === traceId && span.kind === kind);

  const waitForConsumers = (traceId: string, count: number): Promise<void> =>
    vi.waitFor(() => expect(spansOf(traceId, SpanKind.CONSUMER)).toHaveLength(count), WAIT);

  const traceIdsOf = (probeId: string): string[] =>
    recorder.calls.filter((call) => call.probeId === probeId).map((call) => call.ctx.traceId);

  beforeAll(async () => {
    provider.register();
    clock = new ManualClock(DURABLE_JOBS_TEST_START);
    app = await createProbeWorker(TestRedisPrefix.JobTracing, [
      { token: ClockService, value: clock },
    ]);
    txHost = app.get(TransactionHost);
    jobs = app.get(JobsService);
    sweeper = app.get(OutboxSweeperService);
    recorder = app.get(ProbeCallsRecorderService);
    queue = app.get(QueuesService).get(QueueName.Notify);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await queue.obliterate({ force: true });
    await app.close();
    await provider.shutdown();
    trace.disable();
    context.disable();
    propagation.disable();
  });

  it('runs a job in the trace of the request that enqueued it', async () => {
    const probeId = randomUUID();

    const request = await inSpan(REQUEST_SPAN_NAME, () =>
      txHost.withTransaction(() => jobs.enqueue(userCtx(), recordProbeJob, { probeId })),
    );
    await waitForConsumers(request.traceId, 1);

    const [producer] = spansOf(request.traceId, SpanKind.PRODUCER);
    const [consumer] = spansOf(request.traceId, SpanKind.CONSUMER);
    expect(producer?.parentSpanContext?.spanId).toBe(request.spanId);
    expect(consumer?.parentSpanContext?.spanId).toBe(producer?.spanContext().spanId);
    expect(traceIdsOf(probeId)).toEqual([request.traceId]);
  });

  it('records every attempt of a retried job in the trace of the request', async () => {
    const probeId = randomUUID();

    const request = await inSpan(REQUEST_SPAN_NAME, () =>
      jobs.enqueue(userCtx(), flakyProbeJob, { probeId }),
    );
    await waitForConsumers(request.traceId, 2);

    expect(traceIdsOf(probeId)).toEqual([request.traceId, request.traceId]);
  });

  it('keeps the parent of a durable job that the outbox sweeper resends', async () => {
    const probeId = randomUUID();
    vi.spyOn(queue, 'add').mockRejectedValueOnce(new ProbeOutage());

    const request = await inSpan(REQUEST_SPAN_NAME, () =>
      txHost.withTransaction(() =>
        jobs.enqueue(
          { ...userCtx(), workspaceId: randomUUID() },
          recordProbeJob,
          { probeId },
          DURABLE,
        ),
      ),
    );
    clock.advanceBy(PAST_GRACE_MS);
    const sweep = await inSpan(SWEEP_SPAN_NAME, () => sweeper.sweep());
    await waitForConsumers(request.traceId, 1);

    const [producer] = spansOf(request.traceId, SpanKind.PRODUCER);
    expect(producer?.parentSpanContext?.spanId).toBe(request.spanId);
    expect(spansOf(sweep.traceId, SpanKind.PRODUCER)).toEqual([]);
    expect(traceIdsOf(probeId)).toEqual([request.traceId]);
  });

  it.each([false, true])(
    'runs a job with a detached trace (durable: %s) outside the trace of the request',
    async (durable) => {
      const probeId = randomUUID();
      const detached = { durable, detachedTrace: true };

      const request = await inSpan(REQUEST_SPAN_NAME, () =>
        txHost.withTransaction(() =>
          jobs.enqueue(
            { ...userCtx(), workspaceId: randomUUID() },
            recordProbeJob,
            { probeId },
            detached,
          ),
        ),
      );
      await vi.waitFor(() => expect(traceIdsOf(probeId)).toHaveLength(1), WAIT);

      expect(spansOf(request.traceId, SpanKind.PRODUCER)).toEqual([]);
      expect(spansOf(request.traceId, SpanKind.CONSUMER)).toEqual([]);
      expect(traceIdsOf(probeId)).toEqual([PROBE_TRACE_ID]);
    },
  );

  it('starts no trace for a job enqueued outside one', async () => {
    const probeId = randomUUID();
    exporter.reset();

    await jobs.enqueue(userCtx(), recordProbeJob, { probeId });
    await vi.waitFor(() => expect(traceIdsOf(probeId)).toHaveLength(1), WAIT);

    expect(traceIdsOf(probeId)).toEqual([PROBE_TRACE_ID]);
    expect(exporter.getFinishedSpans()).toEqual([]);
  });
});
