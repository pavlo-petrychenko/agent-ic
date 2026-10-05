import { z } from 'zod';
import { agentNodeSchema } from '../../nodes/schemas/agent.schema';
import { apiRequestNodeSchema } from '../../nodes/schemas/api-request.schema';
import { completionNodeSchema } from '../../nodes/schemas/completion.schema';
import { escalationNodeSchema } from '../../nodes/schemas/escalation.schema';
import { parallelNodeSchema } from '../../nodes/schemas/parallel.schema';
import { routerNodeSchema } from '../../nodes/schemas/router.schema';
import { sendMessageNodeSchema } from '../../nodes/schemas/send-message.schema';
import { triggerExternalEventNodeSchema } from '../../nodes/schemas/trigger-external-event.schema';
import { triggerMessageNodeSchema } from '../../nodes/schemas/trigger-message.schema';
import { triggerScheduleNodeSchema } from '../../nodes/schemas/trigger-schedule.schema';

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
