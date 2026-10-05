import { z } from 'zod';
import { agentNodeSchema } from '@flow/nodes/schemas/agent.schema';
import { apiRequestNodeSchema } from '@flow/nodes/schemas/api-request.schema';
import { completionNodeSchema } from '@flow/nodes/schemas/completion.schema';
import { escalationNodeSchema } from '@flow/nodes/schemas/escalation.schema';
import { parallelNodeSchema } from '@flow/nodes/schemas/parallel.schema';
import { routerNodeSchema } from '@flow/nodes/schemas/router.schema';
import { sendMessageNodeSchema } from '@flow/nodes/schemas/send-message.schema';
import { triggerExternalEventNodeSchema } from '@flow/nodes/schemas/trigger-external-event.schema';
import { triggerMessageNodeSchema } from '@flow/nodes/schemas/trigger-message.schema';
import { triggerScheduleNodeSchema } from '@flow/nodes/schemas/trigger-schedule.schema';

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
