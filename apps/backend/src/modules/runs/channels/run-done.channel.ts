import { z } from 'zod';
import {
  RUN_DONE_CHANNEL_NAME,
  RUN_DONE_CHANNEL_SEGMENT,
} from '@/modules/runs/constants/run-reply.constants';
import { RunStatus } from '@/modules/runs/constants/run.constants';
import { channelFor, defineChannel } from '@/platform/live-updates/helpers/channel.helpers';

export const runDoneChannel = defineChannel({
  name: RUN_DONE_CHANNEL_NAME,
  schema: z.object({
    runId: z.uuid(),
    conversationId: z.uuid(),
    status: z.enum(RunStatus),
  }),
});

export type RunDoneEvent = z.infer<typeof runDoneChannel.schema>;

export const runDoneChannelFor = (runId: string) =>
  channelFor(runDoneChannel, runId, RUN_DONE_CHANNEL_SEGMENT);
