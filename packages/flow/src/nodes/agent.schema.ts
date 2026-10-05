import { z } from 'zod';
import { NodeType } from '../document/flow.constants';
import { nodeBaseShape } from '../document/node-base.schema';
import { MAX_RETRIES } from '../limits/limit.constants';
import { outputFieldsSchema } from '../outputs/output-field.schema';
import { modelRefSchema } from '../references/model-ref.schema';
import { promptRefSchema } from '../references/prompt-ref.schema';
import { recordIdSchema } from '../references/record-id.schema';
import { RetrievalMode } from './step.constants';

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
