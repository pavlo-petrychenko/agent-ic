import { Injectable } from '@nestjs/common';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { ProcessJob } from '@/platform/queues/decorators/process-job.decorator';
import type { JobHandler } from '@/platform/queues/typedefs/job.typedefs';
import {
  FLAKY_PROBE_FAILED_ATTEMPTS,
  ProbeListener,
} from '@test/support/constants/async-jobs.constants';
import { ProbeFlakeError } from '@test/support/errors/probe-flake.error';
import { flakyProbeJob } from '@test/support/jobs/flaky-probe.job';
import { ProbeCallsRecorderService } from '@test/support/services/probe-calls-recorder.service';
import type { ProbeData } from '@test/support/typedefs/async-jobs.typedefs';

@Injectable()
@ProcessJob(flakyProbeJob)
export class FlakyProbeProcessor implements JobHandler<ProbeData> {
  constructor(private readonly recorder: ProbeCallsRecorderService) {}

  handle(ctx: UseCaseCtx, data: ProbeData): Promise<void> {
    const attempts = this.recorder.calls.filter((call) => call.probeId === data.probeId).length;
    this.recorder.record({ listener: ProbeListener.Flaky, probeId: data.probeId, ctx });
    return attempts < FLAKY_PROBE_FAILED_ATTEMPTS
      ? Promise.reject(new ProbeFlakeError(data.probeId))
      : Promise.resolve();
  }
}
