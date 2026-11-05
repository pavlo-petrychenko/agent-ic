import { describe, expect, it } from 'vitest';
import { ConversationMode } from '@/modules/conversations/constants/conversation.constants';
import { handedBackEvent } from '@/modules/conversations/events/handed-back.event';

const PAYLOAD = {
  conversationId: '019a0000-0000-7000-8000-000000000001',
  agentId: '019a0000-0000-7000-8000-000000000003',
  mode: ConversationMode.Simulation,
};

describe('handedBackEvent', () => {
  it('accepts the conversation, its agent and its mode', () => {
    expect(handedBackEvent.schema.parse(PAYLOAD)).toEqual(PAYLOAD);
  });

  it('rejects a payload without the agent', () => {
    const { agentId: _agentId, ...withoutAgent } = PAYLOAD;

    expect(handedBackEvent.schema.safeParse(withoutAgent).success).toBe(false);
  });
});
