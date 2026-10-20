import { z } from 'zod';
import { variablePathSchema } from '@flow/document/schemas/node-base.schema';
import { MAX_TEMPLATE_LENGTH } from '@flow/limits/constants/limit.constants';
import {
  PromptSourceKind,
  PromptVersionKind,
} from '@flow/references/constants/reference.constants';
import { recordIdSchema } from '@flow/references/schemas/record-id.schema';
import { PROMPT_VARIABLE_PATH_PATTERN } from '@flow/templates/constants/prompt.constants';

export const promptPinSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal(PromptVersionKind.Pinned), number: z.int().positive() }),
  z.object({ kind: z.literal(PromptVersionKind.Latest) }),
]);

const promptBindingsSchema = z
  .record(z.string().min(1).max(MAX_TEMPLATE_LENGTH), variablePathSchema.min(1))
  .default({})
  .superRefine((bindings, ctx) => {
    const names = new Set<string>();
    for (const name of Object.keys(bindings)) {
      const normalized = name.toLowerCase();
      if (names.has(normalized)) {
        ctx.addIssue({
          code: 'custom',
          path: [name],
          message: 'Duplicate prompt binding',
        });
      }
      names.add(normalized);
    }
  })
  .transform((bindings) =>
    Object.fromEntries(
      Object.entries(bindings).map(([name, target]) => [name.toLowerCase(), target]),
    ),
  )
  .pipe(z.record(z.string().regex(PROMPT_VARIABLE_PATH_PATTERN), variablePathSchema.min(1)));

export const promptSourceSchema = z.object({
  kind: z.literal(PromptSourceKind.Library),
  promptRef: recordIdSchema,
  pin: promptPinSchema,
  bindings: promptBindingsSchema,
});
