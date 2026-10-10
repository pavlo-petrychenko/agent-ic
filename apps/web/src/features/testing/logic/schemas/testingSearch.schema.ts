import { z } from 'zod';

export const testingSearchSchema = z.object({
  agent: z.string().min(1).nullable().catch(null).default(null),
});
