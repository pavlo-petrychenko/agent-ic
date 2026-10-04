import { Injectable } from '@nestjs/common';
import type { UseCaseCtx } from '@/platform/context/use-case-ctx';
import { ProcessJob } from '@/platform/queues/decorators/process-job.decorator';
import type { JobHandler } from '@/platform/queues/typedefs/job.typedefs';
import { ProbeListener } from '@test/support/constants/async-jobs.constants';
import { recordProbeJob } from '@test/support/jobs/record-probe.job';
import { ProbeCallsRecorderService } from '@test/support/services/probe-calls-recorder.service';
import type { ProbeData } from '@test/support/typedefs/async-jobs.typedefs';

@Injectable()
@ProcessJob(recordProbeJob)
export class RecordProbeProcessor implements JobHandler<ProbeData> {
  constructor(private readonly recorder: ProbeCallsRecorderService) {}

  handle(ctx: UseCaseCtx, data: ProbeData): Promise<void> {
    this.recorder.record({ listener: ProbeListener.Record, probeId: data.probeId, ctx });
    return Promise.resolve();
  }
}
