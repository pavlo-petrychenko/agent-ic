import { z } from 'zod';

const telegramUserResponseSchema = z.looseObject({
  id: z.number(),
  first_name: z.string(),
  username: z.string().optional(),
});

const telegramMessageResponseSchema = z.looseObject({
  message_id: z.number(),
  date: z.number(),
  text: z.string().optional(),
  chat: z.looseObject({ id: z.number() }),
  from: telegramUserResponseSchema.optional(),
});

const telegramCallbackQueryResponseSchema = z.looseObject({
  id: z.string(),
  from: telegramUserResponseSchema,
  message: telegramMessageResponseSchema.optional(),
  data: z.string().optional(),
});

export const telegramWebhookUpdateSchema = z.looseObject({
  update_id: z.number(),
  message: telegramMessageResponseSchema.optional(),
  callback_query: telegramCallbackQueryResponseSchema.optional(),
});
