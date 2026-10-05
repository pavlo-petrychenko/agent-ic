import { z } from 'zod';
import { NodeType } from '../document/flow.constants';
import { nodeBaseShape } from '../document/node-base.schema';
import { outputFieldsSchema } from '../outputs/output-field.schema';
import { modelRefSchema } from '../references/model-ref.schema';
import { promptRefSchema } from '../references/prompt-ref.schema';
import { CompletionRole } from './step.constants';

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
