import { z } from 'zod';
import { NodeType } from '../../document/constants/flow.constants';
import { nodeBaseShape } from '../../document/schemas/node-base.schema';
import { recordIdSchema } from '../../references/schemas/record-id.schema';
import { ChannelSelectionMode } from '../constants/trigger.constants';

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
