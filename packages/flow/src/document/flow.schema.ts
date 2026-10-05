import { z } from 'zod';
import { MAX_EDGES, MAX_NODES } from '../limits/limit.constants';
import { flowEdgeSchema } from './edge.schema';
import { FLOW_SCHEMA_VERSION } from './flow.constants';
import { flowNodeSchema } from './node.schema';

export const flowDocumentSchema = z.object({
  schemaVersion: z.literal(FLOW_SCHEMA_VERSION),
  nodes: z.array(flowNodeSchema).max(MAX_NODES),
  edges: z.array(flowEdgeSchema).max(MAX_EDGES),
});
