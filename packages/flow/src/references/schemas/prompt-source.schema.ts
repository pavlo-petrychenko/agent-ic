import { z } from 'zod';
import { variablePathSchema } from '@flow/document/schemas/node-base.schema';
import { MAX_TEMPLATE_LENGTH } from '@flow/limits/constants/limit.constants';
import {
  PromptSourceKind,
  PromptVersionKind,
} from '@flow/references/constants/reference.constants';
import { recordIdSchema } from '@flow/references/schemas/record-id.schema';
import {
  PROMPT_VARIABLE_PATH_PATTERN,
  PROMPT_VARIABLE_PATH_SOURCE,
} from '@flow/templates/constants/prompt.constants';

export const promptPinSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal(PromptVersionKind.Pinned), number: z.int().positive() }),
  z.object({ kind: z.literal(PromptVersionKind.Latest) }),
]);

const promptBindingPathSchema = z
  .string()
  .min(1)
  .max(MAX_TEMPLATE_LENGTH)
  .transform((path) => path.toLowerCase())
  .pipe(z.string().regex(new RegExp(`^${PROMPT_VARIABLE_PATH_SOURCE}$`)));

const promptBindingsSchema = z
  .record(promptBindingPathSchema, variablePathSchema.min(1))
  .default({})
  .refine((bindings) =>
    Object.keys(bindings).every((path) => PROMPT_VARIABLE_PATH_PATTERN.test(path)),
  );

export const promptSourceSchema = z.object({
  kind: z.literal(PromptSourceKind.Library),
  promptRef: recordIdSchema,
  pin: promptPinSchema,
  bindings: promptBindingsSchema,
});
