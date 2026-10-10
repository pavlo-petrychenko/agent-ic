import { describe, expect, it } from 'vitest';
import { SIMULATED_TRANSCRIPT_MAX_CONVERSATIONS } from '@/modules/channels/constants/simulated-channel.constants';
import { SimulatedChannelAdapter } from '@/modules/channels/gateways/simulated-channel-adapter.gateway';
import type { ChannelOutboundMessage } from '@/modules/channels/typedefs/channel-message.typedefs';
import {
  AGENT_REPLY_TEXT,
  TEST_END_USER_EXTERNAL_ID,
} from '@test/support/constants/conversations-testing.constants';

const outbound = (conversationId: string, index: number): ChannelOutboundMessage => ({
  messageId: `${conversationId}:${index}`,
  conversationId,
  channelId: null,
  endUserExternalId: TEST_END_USER_EXTERNAL_ID,
  text: AGENT_REPLY_TEXT,
  quickReplies: [],
});

const sendMany = async (
  adapter: SimulatedChannelAdapter,
  messages: readonly ChannelOutboundMessage[],
): Promise<void> => {
  for (const message of messages) {
    await adapter.send(message);
  }
};

describe('SimulatedChannelAdapter', () => {
  it('forgets the conversation that was sent to least recently', async () => {
    const adapter = new SimulatedChannelAdapter();
    const conversationIds = Array.from(
      { length: SIMULATED_TRANSCRIPT_MAX_CONVERSATIONS },
      (_, index) => `conversation-${index}`,
    );
    await sendMany(
      adapter,
      conversationIds.map((conversationId) => outbound(conversationId, 0)),
    );

    await adapter.send(outbound('conversation-0', 1));
    await adapter.send(outbound('newest', 0));

    expect(adapter.transcript('conversation-1')).toEqual([]);
    expect(adapter.transcript('conversation-0')).toHaveLength(2);
    expect(adapter.transcript('newest')).toHaveLength(1);
  });
});
