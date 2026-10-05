import { z } from 'zod';
import { NodeType } from '@flow/document/constants/flow.constants';
import {
  nodeBaseShape,
  templateSchema,
  variablePathSchema,
} from '@flow/document/schemas/node-base.schema';
import { MAX_LABEL_LENGTH } from '@flow/limits/constants/limit.constants';
import { MessageContentKind, QuickRepliesKind } from '@flow/nodes/constants/step.constants';

export const messageContentSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal(MessageContentKind.List), variable: variablePathSchema }),
  z.object({ kind: z.literal(MessageContentKind.Text), text: templateSchema }),
]);

export const quickRepliesSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal(QuickRepliesKind.None) }),
  z.object({
    kind: z.literal(QuickRepliesKind.Static),
    buttons: z.array(z.string().min(1).max(MAX_LABEL_LENGTH)).min(1),
  }),
  z.object({ kind: z.literal(QuickRepliesKind.Variable), variable: variablePathSchema }),
]);

export const sendMessageConfigSchema = z.object({
  content: messageContentSchema,
  typing: z.boolean(),
  waitForDelivery: z.boolean(),
  quickReplies: quickRepliesSchema,
});

export const sendMessageNodeSchema = z.object({
  ...nodeBaseShape,
  type: z.literal(NodeType.SendMessage),
  config: sendMessageConfigSchema,
});
