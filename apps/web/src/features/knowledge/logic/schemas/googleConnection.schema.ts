import { z } from 'zod';

export const googleConnectionReturnSchema = z.object({
  workspaceId: z.string().min(1),
  knowledgeBaseId: z.string().min(1),
});

export const googleCallbackSearchSchema = z.object({
  code: z.string().optional().catch(undefined),
  state: z.string().optional().catch(undefined),
  error: z.string().optional().catch(undefined),
});
