import { z } from 'zod';
import { flowEdgeSchema } from '@flow/document/schemas/edge.schema';
import { MAX_EDGES, MAX_NODES } from '@flow/limits/constants/limit.constants';
import { agentNodeSchema } from '@flow/nodes/schemas/agent.schema';
import { apiRequestNodeSchema } from '@flow/nodes/schemas/api-request.schema';
import {
  completionConfigSchema,
  completionNodeSchema,
} from '@flow/nodes/schemas/completion.schema';
import { escalationNodeSchema } from '@flow/nodes/schemas/escalation.schema';
import { parallelNodeSchema } from '@flow/nodes/schemas/parallel.schema';
import { routerNodeSchema } from '@flow/nodes/schemas/router.schema';
import { sendMessageNodeSchema } from '@flow/nodes/schemas/send-message.schema';
import { triggerExternalEventNodeSchema } from '@flow/nodes/schemas/trigger-external-event.schema';
import { triggerMessageNodeSchema } from '@flow/nodes/schemas/trigger-message.schema';
import { triggerScheduleNodeSchema } from '@flow/nodes/schemas/trigger-schedule.schema';
import {
  FIRST_SCHEMA_VERSION,
  FlowV1CompletionRole,
  FlowV1WaitFor,
} from '@flow/versions/constants/version.constants';

const completionV1NodeSchema = completionNodeSchema.extend({
  config: completionConfigSchema.extend({ role: z.enum(FlowV1CompletionRole) }),
});

const parallelV1NodeSchema = parallelNodeSchema.extend({
  config: z.object({ waitFor: z.enum(FlowV1WaitFor) }),
});

export const flowV1NodeSchema = z.discriminatedUnion('type', [
  triggerMessageNodeSchema,
  triggerExternalEventNodeSchema,
  triggerScheduleNodeSchema,
  agentNodeSchema,
  completionV1NodeSchema,
  routerNodeSchema,
  parallelV1NodeSchema,
  apiRequestNodeSchema,
  sendMessageNodeSchema,
  escalationNodeSchema,
]);

export const flowV1DocumentSchema = z.object({
  schemaVersion: z.literal(FIRST_SCHEMA_VERSION),
  nodes: z.array(flowV1NodeSchema).max(MAX_NODES),
  edges: z.array(flowEdgeSchema).max(MAX_EDGES),
});
