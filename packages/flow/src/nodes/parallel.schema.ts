import { z } from 'zod';
import { NodeType } from '../document/flow.constants';
import { nodeBaseShape } from '../document/node-base.schema';
import { WaitFor } from './step.constants';

export const parallelConfigSchema = z.object({
  waitFor: z.enum(WaitFor),
});

export const parallelNodeSchema = z.object({
  ...nodeBaseShape,
  type: z.literal(NodeType.Parallel),
  config: parallelConfigSchema,
});
