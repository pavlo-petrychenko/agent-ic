import { isNull } from 'drizzle-orm';
import { conversations } from '@/modules/conversations/db/conversations.table';
import type { Conversation } from '@/modules/conversations/typedefs/conversation.typedefs';

export const neverEscalated = () => isNull(conversations.lastEscalatedAt);

export const hasNeverEscalated = (conversation: Pick<Conversation, 'lastEscalatedAt'>): boolean =>
  conversation.lastEscalatedAt === null;
