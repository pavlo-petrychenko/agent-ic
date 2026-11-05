import { ConversationState } from '@/modules/conversations/constants/conversation.constants';

export const INBOX_CONVERSATIONS_DEFAULT_LIMIT = 50;
export const INBOX_CONVERSATIONS_MAX_LIMIT = 100;

export enum InboxQueue {
  NeedsYou = 'needs_you',
  Live = 'live',
  Closed = 'closed',
}

export const INBOX_QUEUE_STATES: Readonly<Record<InboxQueue, readonly ConversationState[]>> = {
  [InboxQueue.NeedsYou]: [ConversationState.Waiting, ConversationState.Handled],
  [InboxQueue.Live]: [ConversationState.AgentActive],
  [InboxQueue.Closed]: [ConversationState.Closed],
};
