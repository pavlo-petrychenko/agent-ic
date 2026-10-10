import { describe, expect, it } from 'vitest';
import {
  ChannelKind,
  ConversationMode,
} from '@/modules/conversations/constants/conversation.constants';
import { outboundQueuedEvent } from '@/modules/conversations/events/outbound-queued.event';

const PAYLOAD = {
  conversationId: '019a0000-0000-7000-8000-000000000001',
  messageId: '019a0000-0000-7000-8000-000000000002',
  channelKind: ChannelKind.Simulated,
  mode: ConversationMode.Simulation,
};

describe('outboundQueuedEvent', () => {
  it('accepts a payload that carries the conversation mode', () => {
    expect(outboundQueuedEvent.schema.parse(PAYLOAD)).toEqual(PAYLOAD);
  });

  it('rejects a payload without the conversation mode', () => {
    const { mode: _mode, ...withoutMode } = PAYLOAD;

    expect(outboundQueuedEvent.schema.safeParse(withoutMode).success).toBe(false);
  });
});
