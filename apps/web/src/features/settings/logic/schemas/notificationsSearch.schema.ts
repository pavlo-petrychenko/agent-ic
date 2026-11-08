import { z } from 'zod';

export const notificationsSearchSchema = z.object({
  verifyEmail: z.string().min(1).nullable().catch(null).default(null),
});
