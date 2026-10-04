import { JobDefinition } from '@/platform/queues/job.definition';
import { QueueName } from '@/platform/queues/queue.constants';
import { ProbeJobName } from '@test/support/constants/async-jobs.constants';
import { probeDataSchema } from '@test/support/schemas/async-jobs.schema';
import type { ProbeData } from '@test/support/typedefs/async-jobs.typedefs';

export class RecordProbeJob extends JobDefinition<ProbeData> {
  readonly queue = QueueName.Notify;
  readonly name = ProbeJobName.Record;
  readonly schema = probeDataSchema;
}

export const recordProbeJob = new RecordProbeJob();
