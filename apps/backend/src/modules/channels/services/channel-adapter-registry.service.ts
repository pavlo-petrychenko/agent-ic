import { Inject, Injectable } from '@nestjs/common';
import { CHANNEL_ADAPTERS } from '@/modules/channels/constants/channel-adapter.constants';
import { ChannelAdapterNotFoundError } from '@/modules/channels/errors/channel-adapter-not-found.error';
import type { ChannelAdapter } from '@/modules/channels/gateways/channel-adapter.gateway';
import type { ChannelKind } from '@/modules/conversations';

@Injectable()
export class ChannelAdapterRegistryService {
  private readonly byKind: ReadonlyMap<ChannelKind, ChannelAdapter>;

  constructor(@Inject(CHANNEL_ADAPTERS) adapters: readonly ChannelAdapter[]) {
    this.byKind = new Map(adapters.map((adapter) => [adapter.kind, adapter]));
  }

  adapterFor(kind: ChannelKind): ChannelAdapter {
    const adapter = this.byKind.get(kind);
    if (adapter === undefined) {
      throw new ChannelAdapterNotFoundError(kind);
    }
    return adapter;
  }
}
