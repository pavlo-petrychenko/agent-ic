import { describe, expect, it } from 'vitest';
import {
  CONVERSATION_EVENT_EMIT_OPTIONS,
  ConversationEventName,
} from '@/modules/conversations/constants/conversation-event.constants';

describe('CONVERSATION_EVENT_EMIT_OPTIONS', () => {
  it.each([ConversationEventName.MessageReceived, ConversationEventName.OutboundQueued])(
    'emits %s durably',
    (name) => {
      expect(CONVERSATION_EVENT_EMIT_OPTIONS[name].durable).toBe(true);
    },
  );
});
