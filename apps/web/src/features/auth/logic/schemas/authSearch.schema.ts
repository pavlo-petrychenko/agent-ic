import { z } from 'zod';

export const redirectSearchSchema = z.object({
  redirect: z.string().nullable().catch(null).default(null),
});
