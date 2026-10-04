import { Injectable } from '@nestjs/common';
import { ProcessJob } from '@/platform/queues/decorators/process-job.decorator';
import type { JobHandler } from '@/platform/queues/typedefs/job.typedefs';
import { SampleNotFoundError } from '@test/support/fixtures/sample-errors.fixture';
import { rejectProbeJob } from '@test/support/jobs/reject-probe.job';
import type { ProbeData } from '@test/support/typedefs/async-jobs.typedefs';

@Injectable()
@ProcessJob(rejectProbeJob)
export class RejectProbeProcessor implements JobHandler<ProbeData> {
  handle(): Promise<void> {
    return Promise.reject(new SampleNotFoundError());
  }
}
