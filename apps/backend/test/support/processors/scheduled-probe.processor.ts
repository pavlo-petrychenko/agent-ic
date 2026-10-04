import { Injectable } from '@nestjs/common';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { ProcessJob } from '@/platform/queues/decorators/process-job.decorator';
import { ScheduleJob } from '@/platform/queues/decorators/schedule-job.decorator';
import type { JobHandler } from '@/platform/queues/typedefs/job.typedefs';
import { ProbeListener } from '@test/support/constants/async-jobs.constants';
import { scheduledProbeJob, scheduledProbeSchedule } from '@test/support/jobs/scheduled-probe.job';
import { ProbeCallsRecorderService } from '@test/support/services/probe-calls-recorder.service';
import type { ProbeData } from '@test/support/typedefs/async-jobs.typedefs';

@Injectable()
@ProcessJob(scheduledProbeJob)
@ScheduleJob(scheduledProbeSchedule)
export class ScheduledProbeProcessor implements JobHandler<ProbeData> {
  constructor(private readonly recorder: ProbeCallsRecorderService) {}

  handle(ctx: UseCaseCtx, data: ProbeData): Promise<void> {
    this.recorder.record({ listener: ProbeListener.Scheduled, probeId: data.probeId, ctx });
    return Promise.resolve();
  }
}
