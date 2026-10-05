import { z } from 'zod';
import { NodeType } from '@flow/document/constants/flow.constants';
import { nodeBaseShape } from '@flow/document/schemas/node-base.schema';
import { ChannelSelectionMode } from '@flow/nodes/constants/trigger.constants';
import { recordIdSchema } from '@flow/references/schemas/record-id.schema';

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
