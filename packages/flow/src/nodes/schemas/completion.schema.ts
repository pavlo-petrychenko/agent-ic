import { z } from 'zod';
import { NodeType } from '../../document/constants/flow.constants';
import { nodeBaseShape } from '../../document/schemas/node-base.schema';
import { outputFieldsSchema } from '../../outputs/schemas/output-field.schema';
import { modelRefSchema } from '../../references/schemas/model-ref.schema';
import { promptRefSchema } from '../../references/schemas/prompt-ref.schema';
import { CompletionRole } from '../constants/step.constants';

export const completionConfigSchema = z.object({
  role: z.enum(CompletionRole),
  prompt: promptRefSchema.nullable(),
  model: modelRefSchema.nullable(),
  input: z.object({ includeCurrentMessage: z.boolean() }),
  output: outputFieldsSchema.min(1),
});

export const completionNodeSchema = z.object({
  ...nodeBaseShape,
  type: z.literal(NodeType.Completion),
  config: completionConfigSchema,
});
