import { z } from 'zod';
import { NodeType } from '../../document/constants/flow.constants';
import { nodeBaseShape } from '../../document/schemas/node-base.schema';
import { EVENT_NAME_PATTERN } from '../../limits/constants/limit.constants';
import { recordIdSchema } from '../../references/schemas/record-id.schema';
import { ReplyMode } from '../constants/trigger.constants';

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
