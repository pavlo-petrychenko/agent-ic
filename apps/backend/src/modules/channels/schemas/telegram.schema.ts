import { z } from 'zod';
import { ChannelField } from '@/modules/channels/constants/channel-input.constants';
import { TELEGRAM_TOKEN_PATTERN } from '@/modules/channels/constants/telegram.constants';

export const connectTelegramInputSchema = z.object({
  [ChannelField.Token]: z.string().trim().regex(TELEGRAM_TOKEN_PATTERN),
  [ChannelField.AgentId]: z.string().min(1),
  [ChannelField.ShowTyping]: z.boolean().default(true),
});

export const updateTelegramInputSchema = z.object({
  [ChannelField.Id]: z.string().min(1),
  [ChannelField.AgentId]: z.string().min(1),
  [ChannelField.ShowTyping]: z.boolean(),
});

export const replaceTelegramTokenInputSchema = z.object({
  [ChannelField.Id]: z.string().min(1),
  [ChannelField.Token]: z.string().trim().regex(TELEGRAM_TOKEN_PATTERN),
});

const telegramUserResponseSchema = z.looseObject({
  id: z.number(),
  first_name: z.string(),
});

const telegramMessageResponseSchema = z.looseObject({
  message_id: z.number(),
  date: z.number(),
  text: z.string().optional(),
  chat: z.looseObject({ id: z.number() }),
  from: telegramUserResponseSchema.optional(),
});

export const telegramWebhookUpdateSchema = z.looseObject({
  update_id: z.number(),
  message: telegramMessageResponseSchema.optional(),
});
