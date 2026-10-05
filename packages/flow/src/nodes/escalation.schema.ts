import { WorkspaceRole } from '@agent-ic/contracts';
import { z } from 'zod';
import { NodeType } from '../document/flow.constants';
import { nodeBaseShape, templateSchema } from '../document/node-base.schema';
import { recordIdSchema } from '../references/record-id.schema';
import { EscalationMode, NotifyChannel, RecipientsKind } from './step.constants';

export const recipientsSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal(RecipientsKind.Operators) }),
  z.object({ kind: z.literal(RecipientsKind.Role), role: z.enum(WorkspaceRole) }),
  z.object({ kind: z.literal(RecipientsKind.Users), userIds: z.array(recordIdSchema).min(1) }),
]);

export const escalationNotifySchema = z.object({
  recipients: recipientsSchema,
  channels: z.array(z.enum(NotifyChannel)).min(1),
});

const minutesSchema = z.int().positive().nullable();

export const escalationConfigSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal(EscalationMode.Escalate),
    customerMessage: templateSchema.nullable(),
    reason: templateSchema,
    notify: escalationNotifySchema,
    reminderAfterMinutes: minutesSchema,
    fallbackAfterMinutes: minutesSchema,
    fallbackMessage: templateSchema,
  }),
  z.object({
    mode: z.literal(EscalationMode.End),
    customerMessage: templateSchema.nullable(),
  }),
]);

export const escalationNodeSchema = z.object({
  ...nodeBaseShape,
  type: z.literal(NodeType.Escalation),
  config: escalationConfigSchema,
});
