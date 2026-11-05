import { z } from 'zod';
import { NodeType } from '@flow/document/constants/flow.constants';
import { nodeBaseShape } from '@flow/document/schemas/node-base.schema';
import { MAX_INACTIVITY_FIRES, MIN_INACTIVITY_FIRES } from '@flow/limits/constants/limit.constants';
import {
  ChannelType,
  InactivityActivity,
  InactivityRepeatKind,
  InactivityUnit,
} from '@flow/nodes/constants/trigger.constants';

export const inactivityDurationSchema = z.object({
  amount: z.int().positive(),
  unit: z.enum(InactivityUnit),
});

export const inactivityRepeatSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal(InactivityRepeatKind.Once) }),
  z.object({
    kind: z.literal(InactivityRepeatKind.Every),
    every: inactivityDurationSchema,
    maxTimes: z.int().min(MIN_INACTIVITY_FIRES).max(MAX_INACTIVITY_FIRES),
  }),
]);

export const inactivityConditionsSchema = z.object({
  notEscalated: z.boolean(),
  channelTypes: z.array(z.enum(ChannelType)),
});

export const triggerInactivityConfigSchema = z.object({
  silence: inactivityDurationSchema,
  activity: z.enum(InactivityActivity),
  repeat: inactivityRepeatSchema,
  conditions: inactivityConditionsSchema,
});

export const triggerInactivityNodeSchema = z.object({
  ...nodeBaseShape,
  type: z.literal(NodeType.TriggerInactivity),
  config: triggerInactivityConfigSchema,
});
