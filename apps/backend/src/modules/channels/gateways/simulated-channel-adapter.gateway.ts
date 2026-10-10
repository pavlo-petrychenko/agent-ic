import { Injectable } from '@nestjs/common';
import { SIMULATED_TRANSCRIPT_MAX_CONVERSATIONS } from '@/modules/channels/constants/simulated-channel.constants';
import { ChannelAdapter } from '@/modules/channels/gateways/channel-adapter.gateway';
import type { ChannelOutboundMessage } from '@/modules/channels/typedefs/channel-message.typedefs';
import { ChannelKind } from '@/modules/conversations';

@Injectable()
export class SimulatedChannelAdapter extends ChannelAdapter {
  readonly kind = ChannelKind.Simulated;
  private readonly transcripts = new Map<string, readonly ChannelOutboundMessage[]>();

  send(message: ChannelOutboundMessage): Promise<void> {
    const transcript = this.transcripts.get(message.conversationId) ?? [];
    this.transcripts.delete(message.conversationId);
    this.transcripts.set(message.conversationId, [...transcript, message]);
    this.evictOldest();
    return Promise.resolve();
  }

  transcript(conversationId: string): readonly ChannelOutboundMessage[] {
    return this.transcripts.get(conversationId) ?? [];
  }

  private evictOldest(): void {
    for (const conversationId of this.transcripts.keys()) {
      if (this.transcripts.size <= SIMULATED_TRANSCRIPT_MAX_CONVERSATIONS) {
        return;
      }
      this.transcripts.delete(conversationId);
    }
  }
}
