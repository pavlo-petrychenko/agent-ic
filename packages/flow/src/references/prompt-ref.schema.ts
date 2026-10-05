import { z } from 'zod';
import { recordIdSchema } from './record-id.schema';
import { PromptVersionKind } from './reference.constants';

export const promptVersionSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal(PromptVersionKind.Pinned), number: z.int().positive() }),
  z.object({ kind: z.literal(PromptVersionKind.Latest) }),
]);

export const promptRefSchema = z.object({
  promptId: recordIdSchema,
  version: promptVersionSchema,
});
