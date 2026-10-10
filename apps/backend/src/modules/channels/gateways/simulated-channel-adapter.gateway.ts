import { Injectable } from '@nestjs/common';
import { ChannelAdapter } from '@/modules/channels/gateways/channel-adapter.gateway';
import type { ChannelOutboundMessage } from '@/modules/channels/typedefs/channel-message.typedefs';
import { ChannelKind } from '@/modules/conversations';

@Injectable()
export class SimulatedChannelAdapter extends ChannelAdapter {
  readonly kind = ChannelKind.Simulated;
  private readonly transcripts = new Map<string, ChannelOutboundMessage[]>();

  send(message: ChannelOutboundMessage): Promise<void> {
    const transcript = this.transcripts.get(message.conversationId) ?? [];
    this.transcripts.set(message.conversationId, [...transcript, message]);
    return Promise.resolve();
  }

  transcript(conversationId: string): readonly ChannelOutboundMessage[] {
    return this.transcripts.get(conversationId) ?? [];
  }
}
