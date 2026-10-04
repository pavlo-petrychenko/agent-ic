import { Injectable } from '@nestjs/common';
import type { UseCaseCtx } from '@/platform/context/use-case-ctx';
import { OnDomainEvent } from '@/platform/domain-events/on-domain-event.decorator';
import { JobProcessor } from '@/platform/queues/job-processor.decorator';
import type { JobHandler } from '@/platform/queues/queue.typedefs';
import { SampleNotFoundError } from '@/platform/testing/sample-errors.fixture';
import { ProbeListener } from '@test/support/async-jobs.constants';
import {
  auditOnProbeSignedUp,
  recordProbeJob,
  rejectProbeJob,
  welcomeOnProbeSignedUp,
} from '@test/support/async-jobs.definitions';
import type { ProbeData } from '@test/support/async-jobs.typedefs';
import { ProbeCallsRecorder } from '@test/support/probe-calls.recorder';

@Injectable()
@JobProcessor(recordProbeJob)
export class RecordProbeProcessor implements JobHandler<ProbeData> {
  constructor(private readonly recorder: ProbeCallsRecorder) {}

  handle(ctx: UseCaseCtx, data: ProbeData): Promise<void> {
    this.recorder.record({ listener: ProbeListener.Record, probeId: data.probeId, ctx });
    return Promise.resolve();
  }
}

@Injectable()
@JobProcessor(rejectProbeJob)
export class RejectProbeProcessor implements JobHandler<ProbeData> {
  handle(): Promise<void> {
    return Promise.reject(new SampleNotFoundError());
  }
}

@Injectable()
@OnDomainEvent(welcomeOnProbeSignedUp)
export class WelcomeProbeListener implements JobHandler<ProbeData> {
  constructor(private readonly recorder: ProbeCallsRecorder) {}

  handle(ctx: UseCaseCtx, data: ProbeData): Promise<void> {
    this.recorder.record({ listener: ProbeListener.Welcome, probeId: data.probeId, ctx });
    return Promise.resolve();
  }
}

@Injectable()
@OnDomainEvent(auditOnProbeSignedUp)
export class AuditProbeListener implements JobHandler<ProbeData> {
  constructor(private readonly recorder: ProbeCallsRecorder) {}

  handle(ctx: UseCaseCtx, data: ProbeData): Promise<void> {
    this.recorder.record({ listener: ProbeListener.Audit, probeId: data.probeId, ctx });
    return Promise.resolve();
  }
}
