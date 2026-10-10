import { z } from 'zod';
import { templateSchema } from '@flow/document/schemas/node-base.schema';
import {
  PromptSourceKind,
  PromptVersionKind,
} from '@flow/references/constants/reference.constants';
import { recordIdSchema } from '@flow/references/schemas/record-id.schema';

export const promptPinSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal(PromptVersionKind.Pinned), number: z.int().positive() }),
  z.object({ kind: z.literal(PromptVersionKind.Latest) }),
]);

export const promptSourceSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal(PromptSourceKind.Library),
    promptRef: recordIdSchema,
    pin: promptPinSchema,
  }),
  z.object({ kind: z.literal(PromptSourceKind.Inline), text: templateSchema }),
]);
