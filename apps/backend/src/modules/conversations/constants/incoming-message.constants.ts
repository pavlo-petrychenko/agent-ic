import { ConversationState } from '@/modules/conversations/constants/conversation.constants';

export enum IncomingMessageOutcome {
  Duplicate = 'duplicate',
  Stored = 'stored',
  RoutedToInbox = 'routed_to_inbox',
  AwayMessageQueued = 'away_message_queued',
  RunRequested = 'run_requested',
}

export const STORE_ONLY_STATES: ReadonlySet<ConversationState> = new Set([
  ConversationState.Waiting,
  ConversationState.Handled,
]);

export const AWAY_MESSAGE_KEY_PREFIX = 'away';

export const AWAY_MESSAGE_KEY_SEPARATOR = ':';

export const END_USER_LOCK_KEY_SEPARATOR = ':';
