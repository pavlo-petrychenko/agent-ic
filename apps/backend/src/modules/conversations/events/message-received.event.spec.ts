import { describe, expect, it } from 'vitest';
import { ConversationMode } from '@/modules/conversations/constants/conversation.constants';
import { messageReceivedEvent } from '@/modules/conversations/events/message-received.event';

const PAYLOAD = {
  conversationId: '019a0000-0000-7000-8000-000000000001',
  messageId: '019a0000-0000-7000-8000-000000000002',
  agentId: '019a0000-0000-7000-8000-000000000003',
  mode: ConversationMode.Simulation,
};

describe('messageReceivedEvent', () => {
  it('accepts a payload that carries the conversation mode', () => {
    expect(messageReceivedEvent.schema.parse(PAYLOAD)).toEqual(PAYLOAD);
  });

  it('rejects a payload without the conversation mode', () => {
    const { mode: _mode, ...withoutMode } = PAYLOAD;

    expect(messageReceivedEvent.schema.safeParse(withoutMode).success).toBe(false);
  });
});
