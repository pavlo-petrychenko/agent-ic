import type { z } from 'zod';
import type { executeRunJob } from '@/modules/runs/jobs/execute-run.job';

export type ExecuteRunJobData = z.infer<typeof executeRunJob.schema>;
