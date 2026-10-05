import { z } from 'zod';
import { NodeType } from '@flow/document/constants/flow.constants';
import { nodeBaseShape } from '@flow/document/schemas/node-base.schema';
import { MAX_RETRIES } from '@flow/limits/constants/limit.constants';
import { RetrievalMode } from '@flow/nodes/constants/step.constants';
import { outputFieldsSchema } from '@flow/outputs/schemas/output-field.schema';
import { modelRefSchema } from '@flow/references/schemas/model-ref.schema';
import { promptRefSchema } from '@flow/references/schemas/prompt-ref.schema';
import { recordIdSchema } from '@flow/references/schemas/record-id.schema';

export const agentConfigSchema = z.object({
  prompt: promptRefSchema.nullable(),
  model: modelRefSchema.nullable(),
  knowledgeBaseIds: z.array(recordIdSchema),
  retrievalMode: z.enum(RetrievalMode),
  output: outputFieldsSchema,
  retries: z.int().min(0).max(MAX_RETRIES),
});

export const agentNodeSchema = z.object({
  ...nodeBaseShape,
  type: z.literal(NodeType.Agent),
  config: agentConfigSchema,
});
