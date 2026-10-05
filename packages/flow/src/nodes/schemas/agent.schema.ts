import { z } from 'zod';
import { NodeType } from '../../document/constants/flow.constants';
import { nodeBaseShape } from '../../document/schemas/node-base.schema';
import { MAX_RETRIES } from '../../limits/constants/limit.constants';
import { outputFieldsSchema } from '../../outputs/schemas/output-field.schema';
import { modelRefSchema } from '../../references/schemas/model-ref.schema';
import { promptRefSchema } from '../../references/schemas/prompt-ref.schema';
import { recordIdSchema } from '../../references/schemas/record-id.schema';
import { RetrievalMode } from '../constants/step.constants';

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
