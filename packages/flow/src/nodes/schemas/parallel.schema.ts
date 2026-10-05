import { z } from 'zod';
import { NodeType } from '../../document/constants/flow.constants';
import { nodeBaseShape } from '../../document/schemas/node-base.schema';
import { WaitFor } from '../constants/step.constants';

export const parallelConfigSchema = z.object({
  waitFor: z.enum(WaitFor),
});

export const parallelNodeSchema = z.object({
  ...nodeBaseShape,
  type: z.literal(NodeType.Parallel),
  config: parallelConfigSchema,
});
