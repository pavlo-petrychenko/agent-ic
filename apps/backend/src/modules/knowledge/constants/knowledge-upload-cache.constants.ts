import { z } from 'zod';
import {
  KNOWLEDGE_UPLOAD_CACHE_NAME,
  KNOWLEDGE_UPLOAD_CONFIRMED_TTL_SECONDS,
  KNOWLEDGE_UPLOAD_TICKET_TTL_SECONDS,
} from '@/modules/knowledge/constants/knowledge-upload.constants';
import { knowledgeUploadTicketSchema } from '@/modules/knowledge/schemas/knowledge-upload.schema';
import { defineCacheEntry } from '@/platform/cache/helpers/cache.helpers';

export const knowledgeUploadTicketEntry = defineCacheEntry({
  name: KNOWLEDGE_UPLOAD_CACHE_NAME,
  schema: knowledgeUploadTicketSchema,
  ttlSeconds: KNOWLEDGE_UPLOAD_TICKET_TTL_SECONDS,
});

export const knowledgeUploadConfirmedEntry = defineCacheEntry({
  name: `${KNOWLEDGE_UPLOAD_CACHE_NAME}-confirmed`,
  schema: z.object({ sourceId: z.uuid() }),
  ttlSeconds: KNOWLEDGE_UPLOAD_CONFIRMED_TTL_SECONDS,
});
