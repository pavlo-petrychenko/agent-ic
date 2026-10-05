import { z } from 'zod';
import { NodeType } from '../document/flow.constants';
import { nodeBaseShape } from '../document/node-base.schema';
import { recordIdSchema } from '../references/record-id.schema';
import { ChannelSelectionMode } from './trigger.constants';

export const channelSelectionSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal(ChannelSelectionMode.All) }),
  z.object({
    mode: z.literal(ChannelSelectionMode.Selected),
    channelIds: z.array(recordIdSchema).min(1),
  }),
]);

export const triggerMessageConfigSchema = z.object({
  channels: channelSelectionSchema,
});

export const triggerMessageNodeSchema = z.object({
  ...nodeBaseShape,
  type: z.literal(NodeType.TriggerMessage),
  config: triggerMessageConfigSchema,
});
