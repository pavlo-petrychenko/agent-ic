import {
  AWAY_MESSAGE_KEY_PREFIX,
  AWAY_MESSAGE_KEY_SEPARATOR,
} from '@/modules/conversations/constants/incoming-message.constants';

export const awayMessageKey = (conversationId: string, pausedAt: Date): string =>
  [AWAY_MESSAGE_KEY_PREFIX, conversationId, pausedAt.toISOString()].join(
    AWAY_MESSAGE_KEY_SEPARATOR,
  );
