import { z } from 'zod';

export const dataModelListSchema = z.object({
  data: z.array(z.object({ id: z.string() })),
});

export const googleModelListSchema = z.object({
  models: z.array(
    z.object({
      name: z.string(),
      supportedGenerationMethods: z.array(z.string()).default([]),
    }),
  ),
});
