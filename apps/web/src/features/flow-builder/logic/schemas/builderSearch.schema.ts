import { z } from 'zod';

export const builderSearchSchema = z.object({
  node: z.string().min(1).nullable().catch(null).default(null),
});
