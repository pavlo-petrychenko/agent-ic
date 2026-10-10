import { z } from 'zod';

export const mockLlmBodySchema = z.record(z.string(), z.unknown());

export const mockEmbeddingsBodySchema = z.object({
  input: z.union([z.string(), z.array(z.string())]),
});
