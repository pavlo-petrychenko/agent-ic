import { z } from 'zod';
import { NodeType } from '@flow/document/constants/flow.constants';
import { nodeBaseShape } from '@flow/document/schemas/node-base.schema';
import { WaitFor } from '@flow/nodes/constants/step.constants';

export const parallelConfigSchema = z.object({
  waitFor: z.enum(WaitFor),
});

export const parallelNodeSchema = z.object({
  ...nodeBaseShape,
  type: z.literal(NodeType.Parallel),
  config: parallelConfigSchema,
});
