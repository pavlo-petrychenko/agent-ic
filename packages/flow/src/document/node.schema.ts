import { z } from 'zod';
import { agentNodeSchema } from '../nodes/agent.schema';
import { apiRequestNodeSchema } from '../nodes/api-request.schema';
import { completionNodeSchema } from '../nodes/completion.schema';
import { escalationNodeSchema } from '../nodes/escalation.schema';
import { parallelNodeSchema } from '../nodes/parallel.schema';
import { routerNodeSchema } from '../nodes/router.schema';
import { sendMessageNodeSchema } from '../nodes/send-message.schema';
import { triggerExternalEventNodeSchema } from '../nodes/trigger-external-event.schema';
import { triggerMessageNodeSchema } from '../nodes/trigger-message.schema';
import { triggerScheduleNodeSchema } from '../nodes/trigger-schedule.schema';

export const flowNodeSchema = z.discriminatedUnion('type', [
  triggerMessageNodeSchema,
  triggerExternalEventNodeSchema,
  triggerScheduleNodeSchema,
  agentNodeSchema,
  completionNodeSchema,
  routerNodeSchema,
  parallelNodeSchema,
  apiRequestNodeSchema,
  sendMessageNodeSchema,
  escalationNodeSchema,
]);
