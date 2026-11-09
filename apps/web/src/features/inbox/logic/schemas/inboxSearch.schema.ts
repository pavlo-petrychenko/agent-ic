import { z } from 'zod';

export const inboxSearchSchema = z.object({
  conversation: z.string().min(1).nullable().catch(null).default(null),
});
