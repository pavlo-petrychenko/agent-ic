import { z } from 'zod';
import { flowEdgeSchema } from '@flow/document/schemas/edge.schema';
import { MAX_EDGES, MAX_NODES } from '@flow/limits/constants/limit.constants';
import { agentConfigSchema, agentNodeSchema } from '@flow/nodes/schemas/agent.schema';
import { apiRequestNodeSchema } from '@flow/nodes/schemas/api-request.schema';
import { completionNodeSchema } from '@flow/nodes/schemas/completion.schema';
import { escalationNodeSchema } from '@flow/nodes/schemas/escalation.schema';
import { parallelNodeSchema } from '@flow/nodes/schemas/parallel.schema';
import { routerNodeSchema } from '@flow/nodes/schemas/router.schema';
import { sendMessageNodeSchema } from '@flow/nodes/schemas/send-message.schema';
import { triggerExternalEventNodeSchema } from '@flow/nodes/schemas/trigger-external-event.schema';
import { triggerMessageNodeSchema } from '@flow/nodes/schemas/trigger-message.schema';
import { triggerScheduleNodeSchema } from '@flow/nodes/schemas/trigger-schedule.schema';
import { SECOND_SCHEMA_VERSION } from '@flow/versions/constants/version.constants';

export const agentV2NodeSchema = agentNodeSchema.extend({
  config: agentConfigSchema.omit({ exits: true }),
});

export const flowV2NodeSchema = z.discriminatedUnion('type', [
  triggerMessageNodeSchema,
  triggerExternalEventNodeSchema,
  triggerScheduleNodeSchema,
  agentV2NodeSchema,
  completionNodeSchema,
  routerNodeSchema,
  parallelNodeSchema,
  apiRequestNodeSchema,
  sendMessageNodeSchema,
  escalationNodeSchema,
]);

export const flowV2DocumentSchema = z.object({
  schemaVersion: z.literal(SECOND_SCHEMA_VERSION),
  nodes: z.array(flowV2NodeSchema).max(MAX_NODES),
  edges: z.array(flowEdgeSchema).max(MAX_EDGES),
});
