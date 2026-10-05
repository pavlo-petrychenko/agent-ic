import { z } from 'zod';
import { ModelProviderKind } from '@flow/references/constants/reference.constants';
import { recordIdSchema } from '@flow/references/schemas/record-id.schema';

export const modelProviderSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal(ModelProviderKind.Platform) }),
  z.object({ kind: z.literal(ModelProviderKind.Workspace), providerKeyId: recordIdSchema }),
]);

export const modelRefSchema = z.object({
  provider: modelProviderSchema,
  model: z.string().min(1),
});
