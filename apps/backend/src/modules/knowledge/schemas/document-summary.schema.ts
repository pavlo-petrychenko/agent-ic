import { z } from 'zod';
import { KNOWLEDGE_SUMMARY_MAX_LENGTH } from '@/modules/knowledge/constants/knowledge-summary.constants';

export const documentSummaryOutputSchema = z.object({
  summary: z.string().trim().min(1).max(KNOWLEDGE_SUMMARY_MAX_LENGTH),
});
