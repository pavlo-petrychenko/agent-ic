import { describe, expect, it } from 'vitest';
import { executeRunJob } from '@/modules/runs/jobs/execute-run.job';
import { QueueName } from '@/platform/queues/constants/queue.constants';

const RUN_ID = '019a0000-0000-7000-8000-000000000001';

describe('executeRunJob', () => {
  it('runs on the reactive runs queue', () => {
    expect(executeRunJob.queue).toBe(QueueName.RunsReactive);
  });

  it('carries only the run id', () => {
    expect(executeRunJob.schema.parse({ runId: RUN_ID })).toEqual({ runId: RUN_ID });
  });

  it('rejects a run id that is not a uuid', () => {
    expect(executeRunJob.schema.safeParse({ runId: 'run' }).success).toBe(false);
  });
});
