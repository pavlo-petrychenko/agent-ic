import { z } from 'zod';
import { NodeType } from '@flow/document/constants/flow.constants';
import { nodeBaseShape } from '@flow/document/schemas/node-base.schema';
import { CompletionRole } from '@flow/nodes/constants/step.constants';
import { outputFieldsSchema } from '@flow/outputs/schemas/output-field.schema';
import { modelRefSchema } from '@flow/references/schemas/model-ref.schema';
import { promptRefSchema } from '@flow/references/schemas/prompt-ref.schema';

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
