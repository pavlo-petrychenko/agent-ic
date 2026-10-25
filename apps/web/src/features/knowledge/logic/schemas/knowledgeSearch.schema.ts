import { z } from 'zod';

export const knowledgeSearchSchema = z.object({
  kb: z.string().optional(),
});
