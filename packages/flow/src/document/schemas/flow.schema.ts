import { z } from 'zod';
import { MAX_EDGES, MAX_NODES } from '../../limits/constants/limit.constants';
import { FLOW_SCHEMA_VERSION } from '../constants/flow.constants';
import { flowEdgeSchema } from './edge.schema';
import { flowNodeSchema } from './node.schema';

export const flowDocumentSchema = z.object({
  schemaVersion: z.literal(FLOW_SCHEMA_VERSION),
  nodes: z.array(flowNodeSchema).max(MAX_NODES),
  edges: z.array(flowEdgeSchema).max(MAX_EDGES),
});
