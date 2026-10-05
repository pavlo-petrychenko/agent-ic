import { z } from 'zod';
import { recordIdSchema } from './record-id.schema';
import { ModelProviderKind } from './reference.constants';

export const modelProviderSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal(ModelProviderKind.Platform) }),
  z.object({ kind: z.literal(ModelProviderKind.Workspace), providerKeyId: recordIdSchema }),
]);

export const modelRefSchema = z.object({
  provider: modelProviderSchema,
  model: z.string().min(1),
});
