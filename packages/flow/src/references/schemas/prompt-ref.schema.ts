import { z } from 'zod';
import { PromptVersionKind } from '@flow/references/constants/reference.constants';
import { recordIdSchema } from '@flow/references/schemas/record-id.schema';

export const promptVersionSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal(PromptVersionKind.Pinned), number: z.int().positive() }),
  z.object({ kind: z.literal(PromptVersionKind.Latest) }),
]);

export const promptRefSchema = z.object({
  promptId: recordIdSchema,
  version: promptVersionSchema,
});
