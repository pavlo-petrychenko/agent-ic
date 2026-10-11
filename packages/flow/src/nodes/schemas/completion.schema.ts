import { ReasoningLevel } from '@agent-ic/contracts';
import { z } from 'zod';
import { NodeType } from '@flow/document/constants/flow.constants';
import { nodeBaseShape } from '@flow/document/schemas/node-base.schema';
import { CompletionRole } from '@flow/nodes/constants/step.constants';
import { outputFieldsSchema } from '@flow/outputs/schemas/output-field.schema';
import { modelRefSchema } from '@flow/references/schemas/model-ref.schema';
import { promptSourceSchema } from '@flow/references/schemas/prompt-source.schema';

export const completionConfigSchema = z.object({
  role: z.enum(CompletionRole),
  prompt: promptSourceSchema.nullable(),
  model: modelRefSchema.nullable(),
  reasoning: z.enum(ReasoningLevel).nullable().default(null),
  input: z.object({ includeCurrentMessage: z.boolean() }),
  output: outputFieldsSchema.min(1),
});

export const completionNodeSchema = z.object({
  ...nodeBaseShape,
  type: z.literal(NodeType.Completion),
  config: completionConfigSchema,
});
