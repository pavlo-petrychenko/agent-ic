import { z } from 'zod';
import { NodeType } from '../document/flow.constants';
import { nodeBaseShape } from '../document/node-base.schema';
import { MAX_LABEL_LENGTH, TIME_OF_DAY_PATTERN } from '../limits/limit.constants';
import { ChannelType, ScheduleKind } from './trigger.constants';

const timeZoneSchema = z.string().min(1).max(MAX_LABEL_LENGTH);
const timeOfDaySchema = z.string().regex(TIME_OF_DAY_PATTERN);

export const scheduleSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal(ScheduleKind.Daily),
    time: timeOfDaySchema,
    timeZone: timeZoneSchema,
  }),
  z.object({
    kind: z.literal(ScheduleKind.Weekdays),
    time: timeOfDaySchema,
    timeZone: timeZoneSchema,
  }),
  z.object({
    kind: z.literal(ScheduleKind.Custom),
    cron: z.string().max(MAX_LABEL_LENGTH),
    timeZone: timeZoneSchema,
  }),
]);

export const scheduleConditionsSchema = z.object({
  silentForHours: z.int().positive().nullable(),
  notEscalated: z.boolean(),
  channelTypes: z.array(z.enum(ChannelType)),
});

export const triggerScheduleConfigSchema = z.object({
  schedule: scheduleSchema,
  conditions: scheduleConditionsSchema,
  maxConversationsPerRun: z.int().positive(),
  oncePerConversation: z.boolean(),
});

export const triggerScheduleNodeSchema = z.object({
  ...nodeBaseShape,
  type: z.literal(NodeType.TriggerSchedule),
  config: triggerScheduleConfigSchema,
});
