import { z } from 'zod';
import {
  INBOX_CONVERSATIONS_DEFAULT_LIMIT,
  INBOX_CONVERSATIONS_MAX_LIMIT,
  INBOX_FILTER_MAX_IDS,
  INBOX_SEARCH_MAX_LENGTH,
  InboxQueue,
} from '@/modules/conversations/constants/inbox.constants';

const inboxConversationsCursorSchema = z.object({
  lastMessageAt: z.iso.datetime(),
  id: z.string().min(1),
});

const filterSchema = z
  .array(z.string().min(1))
  .max(INBOX_FILTER_MAX_IDS)
  .nullable()
  .optional()
  .transform((value) => value ?? []);

const inboxFilterShape = {
  channelIds: filterSchema,
  agentIds: filterSchema,
  search: z
    .string()
    .max(INBOX_SEARCH_MAX_LENGTH)
    .nullable()
    .optional()
    .transform((value) => {
      const search = value?.trim() ?? '';
      return search === '' ? null : search;
    }),
};

export const inboxConversationsInputSchema = z
  .object({
    limit: z.number().int().min(1).max(INBOX_CONVERSATIONS_MAX_LIMIT).nullable().default(null),
    after: inboxConversationsCursorSchema.nullable().default(null),
    queue: z.enum(InboxQueue),
    ...inboxFilterShape,
  })
  .transform(({ limit, after, queue, channelIds, agentIds, search }) => ({
    limit: limit ?? INBOX_CONVERSATIONS_DEFAULT_LIMIT,
    after,
    queue,
    channelIds,
    agentIds,
    search,
  }));

export const inboxCountsInputSchema = z
  .object(inboxFilterShape)
  .nullable()
  .default(null)
  .transform((value) => value ?? { channelIds: [], agentIds: [], search: null });

export const inboxConversationInputSchema = z.object({
  id: z.string().min(1),
});
