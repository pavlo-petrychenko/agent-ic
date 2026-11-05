import { z } from 'zod';
import { templateSchema } from '@flow/document/schemas/node-base.schema';
import {
  MAX_AUTO_CLOSE_MINUTES,
  MIN_AUTO_CLOSE_MINUTES,
} from '@flow/limits/constants/limit.constants';
import { handoffShape } from '@flow/nodes/schemas/escalation.schema';
import { UnhandledFailureAction } from '@flow/settings/constants/settings.constants';

export const handoffSettingsSchema = z.object(handoffShape);

export const unhandledFailureSettingsSchema = z.object({
  action: z.literal(UnhandledFailureAction.Handoff),
  customerMessage: templateSchema,
});

export const autoCloseSettingsSchema = z.object({
  afterMinutes: z.int().min(MIN_AUTO_CLOSE_MINUTES).max(MAX_AUTO_CLOSE_MINUTES),
});

export const flowSettingsSchema = z.object({
  handoff: handoffSettingsSchema.nullable(),
  onUnhandledFailure: unhandledFailureSettingsSchema.nullable(),
  autoClose: autoCloseSettingsSchema.nullable(),
});
