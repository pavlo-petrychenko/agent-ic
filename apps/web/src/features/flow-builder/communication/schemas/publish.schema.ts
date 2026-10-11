import { z } from 'zod';

export const diffNodeSchema = z.object({
  id: z.string(),
  key: z.string(),
  label: z.string(),
});

export const diffEdgeSchema = z.object({
  source: z.string(),
  target: z.string(),
});
