import { z } from 'zod';
import { ChannelField } from '@/modules/channels/constants/channel-input.constants';
import { TELEGRAM_TOKEN_PATTERN } from '@/modules/channels/constants/telegram.constants';

export { telegramWebhookUpdateSchema } from '@/platform/telegram/schemas/telegram-update.schema';

export const connectTelegramInputSchema = z.object({
  [ChannelField.Token]: z.string().trim().regex(TELEGRAM_TOKEN_PATTERN),
  [ChannelField.AgentId]: z.string().min(1),
  [ChannelField.ShowTyping]: z.boolean().default(true),
});

export const replaceTelegramTokenInputSchema = z.object({
  [ChannelField.Id]: z.string().min(1),
  [ChannelField.Token]: z.string().trim().regex(TELEGRAM_TOKEN_PATTERN),
});
