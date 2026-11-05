import { z } from 'zod';
import { KnowledgeGoogleSearchParam } from '@/features/knowledge/constants/googleConnection.constants';

export const knowledgeSearchSchema = z.object({
  kb: z.string().optional(),
  google: z.enum(KnowledgeGoogleSearchParam).optional(),
});
