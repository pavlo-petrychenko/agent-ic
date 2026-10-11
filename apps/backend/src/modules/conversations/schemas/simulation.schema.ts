import { END_USER_LANGUAGE_MAX_LENGTH } from '@agent-ic/contracts';
import { z } from 'zod';
import { ChannelKind } from '@/modules/conversations/constants/conversation.constants';

const publicIdSchema = z.string().min(1);

const orNull = <TValue>(value: TValue | null | undefined): TValue | null => value ?? null;

export const startSimulationSchema = z.object({
  agentId: publicIdSchema,
  versionId: publicIdSchema.nullish().transform(orNull),
  channelKind: z.enum(ChannelKind),
  language: z.string().trim().min(1).max(END_USER_LANGUAGE_MAX_LENGTH).nullish().transform(orNull),
});
