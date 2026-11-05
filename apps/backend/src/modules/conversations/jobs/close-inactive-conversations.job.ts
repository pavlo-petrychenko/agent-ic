import { z } from 'zod';
import {
  AUTO_CLOSE_SWEEP_INTERVAL_SECONDS,
  ConversationJobName,
} from '@/modules/conversations/constants/conversation-job.constants';
import { QueueName } from '@/platform/queues/constants/queue.constants';
import { defineJob, defineJobSchedule } from '@/platform/queues/helpers/job.helpers';

export const closeInactiveConversationsJob = defineJob({
  queue: QueueName.Timers,
  name: ConversationJobName.CloseInactive,
  schema: z.object({}),
});

export const closeInactiveConversationsSchedule = defineJobSchedule({
  job: closeInactiveConversationsJob,
  everySeconds: AUTO_CLOSE_SWEEP_INTERVAL_SECONDS,
  data: {},
});
