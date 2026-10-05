import { z } from 'zod';
import { FLOW_SCHEMA_VERSION } from '@flow/document/constants/flow.constants';
import { flowEdgeSchema } from '@flow/document/schemas/edge.schema';
import { flowNodeSchema } from '@flow/document/schemas/node.schema';
import { MAX_EDGES, MAX_NODES } from '@flow/limits/constants/limit.constants';

export const flowDocumentSchema = z.object({
  schemaVersion: z.literal(FLOW_SCHEMA_VERSION),
  nodes: z.array(flowNodeSchema).max(MAX_NODES),
  edges: z.array(flowEdgeSchema).max(MAX_EDGES),
});
