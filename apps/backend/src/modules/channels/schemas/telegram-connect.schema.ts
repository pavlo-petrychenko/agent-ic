import { z } from 'zod';
import { TELEGRAM_TOKEN_PATTERN } from '@/modules/channels/constants/telegram.constants';

export const connectTelegramInputSchema = z.object({
  token: z.string().trim().regex(TELEGRAM_TOKEN_PATTERN),
  agentId: z.string().min(1),
  showTyping: z.boolean().default(true),
});
