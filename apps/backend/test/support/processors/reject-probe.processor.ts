import { Injectable } from '@nestjs/common';
import { JobProcessor } from '@/platform/queues/job-processor.decorator';
import type { JobHandler } from '@/platform/queues/queue.typedefs';
import { SampleNotFoundError } from '@test/support/fixtures/sample-errors.fixture';
import { rejectProbeJob } from '@test/support/jobs/reject-probe.job';
import type { ProbeData } from '@test/support/typedefs/async-jobs.typedefs';

@Injectable()
@JobProcessor(rejectProbeJob)
export class RejectProbeProcessor implements JobHandler<ProbeData> {
  handle(): Promise<void> {
    return Promise.reject(new SampleNotFoundError());
  }
}
