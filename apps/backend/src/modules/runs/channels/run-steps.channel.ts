import { z } from 'zod';
import { RUN_STEPS_CHANNEL_NAME, RunStepStatus } from '@/modules/runs/constants/run.constants';
import { defineChannel } from '@/platform/live-updates/helpers/channel.helpers';

export const runStepsChannel = defineChannel({
  name: RUN_STEPS_CHANNEL_NAME,
  schema: z.object({
    runId: z.uuid(),
    stepId: z.uuid(),
    nodeId: z.string(),
    branchKey: z.string(),
    status: z.enum(RunStepStatus),
    port: z.string().nullable(),
  }),
});
