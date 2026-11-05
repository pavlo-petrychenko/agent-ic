import { z } from 'zod';
import {
  INBOX_CONVERSATIONS_DEFAULT_LIMIT,
  INBOX_CONVERSATIONS_MAX_LIMIT,
  InboxQueue,
} from '@/modules/conversations/constants/inbox.constants';

const inboxConversationsCursorSchema = z.object({
  lastMessageAt: z.iso.datetime(),
  id: z.string().min(1),
});

export const inboxConversationsInputSchema = z
  .object({
    limit: z.number().int().min(1).max(INBOX_CONVERSATIONS_MAX_LIMIT).nullable().default(null),
    after: inboxConversationsCursorSchema.nullable().default(null),
    queue: z.enum(InboxQueue),
  })
  .transform(({ limit, after, queue }) => ({
    limit: limit ?? INBOX_CONVERSATIONS_DEFAULT_LIMIT,
    after,
    queue,
  }));

export const inboxConversationInputSchema = z.object({
  id: z.string().min(1),
});
