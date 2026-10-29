import { describe, expect, it } from 'vitest';
import { executeProactiveRunJob } from '@/modules/runs/jobs/execute-proactive-run.job';
import { executeRunJob } from '@/modules/runs/jobs/execute-run.job';
import { QueueName } from '@/platform/queues/constants/queue.constants';

const RUN_ID = '019a0000-0000-7000-8000-000000000002';

describe('executeProactiveRunJob', () => {
  it('runs on the proactive runs queue under its own name', () => {
    expect(executeProactiveRunJob.queue).toBe(QueueName.RunsProactive);
    expect(executeProactiveRunJob.name).not.toBe(executeRunJob.name);
  });

  it('carries only the run id', () => {
    expect(executeProactiveRunJob.schema.parse({ runId: RUN_ID })).toEqual({ runId: RUN_ID });
    expect(executeProactiveRunJob.schema.safeParse({ runId: 'run' }).success).toBe(false);
  });
});
