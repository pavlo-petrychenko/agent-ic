import { EMAIL_MAX_LENGTH } from '@agent-ic/contracts';
import { z } from 'zod';

export const updateNotificationEmailInputSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email().max(EMAIL_MAX_LENGTH)),
});

export const verifyNotificationEmailInputSchema = z.object({
  token: z.string().trim().min(1),
});
