import { z } from 'zod';
import { NodeType } from '@flow/document/constants/flow.constants';
import { nodeBaseShape } from '@flow/document/schemas/node-base.schema';
import { EVENT_NAME_PATTERN } from '@flow/limits/constants/limit.constants';
import { ReplyMode } from '@flow/nodes/constants/trigger.constants';
import { recordIdSchema } from '@flow/references/schemas/record-id.schema';

export const triggerExternalEventConfigSchema = z.object({
  eventName: z.string().regex(EVENT_NAME_PATTERN).nullable(),
  channelId: recordIdSchema.nullable(),
  examplePayload: z.record(z.string(), z.json()),
  replyMode: z.enum(ReplyMode),
});

export const triggerExternalEventNodeSchema = z.object({
  ...nodeBaseShape,
  type: z.literal(NodeType.TriggerExternalEvent),
  config: triggerExternalEventConfigSchema,
});
