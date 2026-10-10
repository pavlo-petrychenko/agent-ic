import { z } from 'zod';

export const mockLlmBodySchema = z.record(z.string(), z.unknown());

export const mockEmbeddingsBodySchema = z.object({
  input: z.union([z.string(), z.array(z.string())]),
});

export const mockSentToolsSchema = z.object({
  tools: z
    .array(
      z.union([
        z.object({ function: z.object({ name: z.string() }) }),
        z.object({ name: z.string() }),
      ]),
    )
    .default([]),
});
