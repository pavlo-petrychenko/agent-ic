import { z } from 'zod';
import { routerRulesSchema } from '../conditions/condition.schema';
import { NodeType } from '../document/flow.constants';
import { nodeBaseShape } from '../document/node-base.schema';

export const routerConfigSchema = z.object({
  rules: routerRulesSchema,
});

export const routerNodeSchema = z.object({
  ...nodeBaseShape,
  type: z.literal(NodeType.Router),
  config: routerConfigSchema,
});
