import { z } from 'zod';
import { routerRulesSchema } from '@flow/conditions/schemas/condition.schema';
import { NodeType } from '@flow/document/constants/flow.constants';
import { nodeBaseShape } from '@flow/document/schemas/node-base.schema';

export const routerConfigSchema = z.object({
  rules: routerRulesSchema,
});

export const routerNodeSchema = z.object({
  ...nodeBaseShape,
  type: z.literal(NodeType.Router),
  config: routerConfigSchema,
});
