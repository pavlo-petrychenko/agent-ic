import { z } from 'zod';

export const NOTIFICATIONS_SEARCH_DEFAULTS = { verifyEmail: null };

export const notificationsSearchSchema = z.object({
  verifyEmail: z
    .string()
    .nullable()
    .catch(null)
    .default(null)
    .transform((value) => (value === 'null' || value === '' ? null : value)),
});
