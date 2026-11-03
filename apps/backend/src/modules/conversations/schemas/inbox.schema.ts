import { z } from 'zod';
import {
  INBOX_CONVERSATIONS_DEFAULT_LIMIT,
  INBOX_CONVERSATIONS_MAX_LIMIT,
} from '@/modules/conversations/constants/inbox.constants';

export const inboxConversationsInputSchema = z
  .object({
    limit: z.number().int().min(1).max(INBOX_CONVERSATIONS_MAX_LIMIT).nullable().default(null),
  })
  .transform(({ limit }) => ({
    limit: limit ?? INBOX_CONVERSATIONS_DEFAULT_LIMIT,
  }));

export const inboxConversationInputSchema = z.object({
  id: z.string().min(1),
});
