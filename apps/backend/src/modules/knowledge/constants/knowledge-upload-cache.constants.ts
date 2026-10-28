import {
  KNOWLEDGE_UPLOAD_CACHE_NAME,
  KNOWLEDGE_UPLOAD_TICKET_TTL_SECONDS,
} from '@/modules/knowledge/constants/knowledge-upload.constants';
import { knowledgeUploadTicketSchema } from '@/modules/knowledge/schemas/knowledge-upload.schema';
import { defineCacheEntry } from '@/platform/cache/helpers/cache.helpers';

export const knowledgeUploadTicketEntry = defineCacheEntry({
  name: KNOWLEDGE_UPLOAD_CACHE_NAME,
  schema: knowledgeUploadTicketSchema,
  ttlSeconds: KNOWLEDGE_UPLOAD_TICKET_TTL_SECONDS,
});
