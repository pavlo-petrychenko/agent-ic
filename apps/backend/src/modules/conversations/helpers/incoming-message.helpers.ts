import {
  AWAY_MESSAGE_KEY_PREFIX,
  AWAY_MESSAGE_KEY_SEPARATOR,
  END_USER_LOCK_KEY_SEPARATOR,
} from '@/modules/conversations/constants/incoming-message.constants';
import type { EndUserConversationKey } from '@/modules/conversations/typedefs/conversation.typedefs';

export const awayMessageKey = (conversationId: string, pausedAt: Date): string =>
  [AWAY_MESSAGE_KEY_PREFIX, conversationId, pausedAt.toISOString()].join(
    AWAY_MESSAGE_KEY_SEPARATOR,
  );

export const endUserLockKey = (key: EndUserConversationKey): string =>
  [key.workspaceId, key.agentId, key.mode, key.channelKind, key.endUserExternalId].join(
    END_USER_LOCK_KEY_SEPARATOR,
  );
