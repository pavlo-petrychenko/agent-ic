import { z } from 'zod';
import { KnowledgeField } from '@/modules/knowledge/constants/knowledge-input.constants';
import {
  KNOWLEDGE_SCHEDULE_MAX_WEEKDAY,
  KNOWLEDGE_SCHEDULE_MIN_WEEKDAY,
  KNOWLEDGE_SCHEDULE_TIME_PATTERN,
  KNOWLEDGE_SCHEDULE_TIME_REQUIRED_MESSAGE,
  KNOWLEDGE_SCHEDULE_WEEKDAY_REQUIRED_MESSAGE,
} from '@/modules/knowledge/constants/knowledge-schedule.constants';
import { KnowledgeSyncInterval } from '@/modules/knowledge/constants/knowledge.constants';

const syncIntervalSchema = z
  .enum(KnowledgeSyncInterval)
  .nullish()
  .transform((value) => value ?? null);
const syncTimeSchema = z
  .string()
  .trim()
  .regex(KNOWLEDGE_SCHEDULE_TIME_PATTERN)
  .nullish()
  .transform((value) => value ?? null);
const syncWeekdaySchema = z
  .number()
  .int()
  .min(KNOWLEDGE_SCHEDULE_MIN_WEEKDAY)
  .max(KNOWLEDGE_SCHEDULE_MAX_WEEKDAY)
  .nullish()
  .transform((value) => value ?? null);

export const knowledgeScheduleInputShape = {
  [KnowledgeField.SyncInterval]: syncIntervalSchema,
  [KnowledgeField.SyncTime]: syncTimeSchema,
  [KnowledgeField.SyncWeekday]: syncWeekdaySchema,
};

export const requireScheduleFields = (
  input: {
    readonly syncInterval: KnowledgeSyncInterval | null;
    readonly syncTime: string | null;
    readonly syncWeekday: number | null;
  },
  ctx: z.RefinementCtx,
): void => {
  if (input.syncInterval === null) {
    return;
  }
  if (
    (input.syncInterval === KnowledgeSyncInterval.Daily ||
      input.syncInterval === KnowledgeSyncInterval.Weekly) &&
    input.syncTime === null
  ) {
    ctx.addIssue({
      code: 'custom',
      path: [KnowledgeField.SyncTime],
      message: KNOWLEDGE_SCHEDULE_TIME_REQUIRED_MESSAGE,
    });
  }
  if (input.syncInterval === KnowledgeSyncInterval.Weekly && input.syncWeekday === null) {
    ctx.addIssue({
      code: 'custom',
      path: [KnowledgeField.SyncWeekday],
      message: KNOWLEDGE_SCHEDULE_WEEKDAY_REQUIRED_MESSAGE,
    });
  }
};
