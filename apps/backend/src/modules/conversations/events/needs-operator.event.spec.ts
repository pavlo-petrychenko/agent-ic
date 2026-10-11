import { describe, expect, it } from 'vitest';
import {
  ConversationMode,
  WaitingReason,
} from '@/modules/conversations/constants/conversation.constants';
import { needsOperatorEvent } from '@/modules/conversations/events/needs-operator.event';

const PAYLOAD = {
  conversationId: '019a0000-0000-7000-8000-000000000001',
  agentId: '019a0000-0000-7000-8000-000000000003',
  reason: WaitingReason.AgentPaused,
  mode: ConversationMode.Live,
};

describe('needsOperatorEvent', () => {
  it('accepts a payload that carries the conversation mode', () => {
    expect(needsOperatorEvent.schema.parse(PAYLOAD)).toEqual(PAYLOAD);
  });

  it('rejects a payload without the conversation mode', () => {
    const { mode: _mode, ...withoutMode } = PAYLOAD;

    expect(needsOperatorEvent.schema.safeParse(withoutMode).success).toBe(false);
  });
});
