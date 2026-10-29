import { END_USER_LANGUAGE_MAX_LENGTH, SIMULATOR_MESSAGE_MAX_LENGTH } from '@agent-ic/contracts';
import { z } from 'zod';
import { ChannelKind } from '@/modules/conversations/constants/conversation.constants';

const publicIdSchema = z.string().min(1);

const orNull = <TValue>(value: TValue | null | undefined): TValue | null => value ?? null;

export const simulationAgentSchema = z.object({ agentId: publicIdSchema });

export const simulatorMessageSchema = z.object({
  conversationId: publicIdSchema,
  text: z.string().trim().min(1).max(SIMULATOR_MESSAGE_MAX_LENGTH),
});

export const startSimulationSchema = z.object({
  agentId: publicIdSchema,
  versionId: publicIdSchema.nullish().transform(orNull),
  channelKind: z.enum(ChannelKind),
  language: z.string().trim().min(1).max(END_USER_LANGUAGE_MAX_LENGTH).nullish().transform(orNull),
});

export const operatorReplySchema = simulatorMessageSchema;

export const operatorConversationSchema = z.object({ conversationId: publicIdSchema });

export const simulationConversationSchema = z.object({ conversationId: publicIdSchema });
