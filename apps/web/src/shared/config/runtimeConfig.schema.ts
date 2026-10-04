import { z } from 'zod';

export const runtimeConfigSchema = z.object({
  graphqlPath: z.string().startsWith('/'),
});
