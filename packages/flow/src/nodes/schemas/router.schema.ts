import { z } from 'zod';
import { routerRulesSchema } from '../../conditions/schemas/condition.schema';
import { NodeType } from '../../document/constants/flow.constants';
import { nodeBaseShape } from '../../document/schemas/node-base.schema';

export const routerConfigSchema = z.object({
  rules: routerRulesSchema,
});

export const routerNodeSchema = z.object({
  ...nodeBaseShape,
  type: z.literal(NodeType.Router),
  config: routerConfigSchema,
});
