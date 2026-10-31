import { z } from 'zod';
import { KnowledgeField } from '@/modules/knowledge/constants/knowledge-input.constants';

export const createGooglePickerSessionInputSchema = z.object({
  [KnowledgeField.ConnectionId]: z.string().min(1),
});
