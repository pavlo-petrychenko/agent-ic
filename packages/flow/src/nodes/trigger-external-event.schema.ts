import { z } from 'zod';
import { NodeType } from '../document/flow.constants';
import { nodeBaseShape } from '../document/node-base.schema';
import { EVENT_NAME_PATTERN } from '../limits/limit.constants';
import { recordIdSchema } from '../references/record-id.schema';
import { ReplyMode } from './trigger.constants';

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
