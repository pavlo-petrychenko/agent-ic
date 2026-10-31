import { IdPrefix } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { ApiChannelIngressRepository } from '@/modules/channels/repositories/api-channel-ingress.repository';
import type { ApiChannelIngressRecord } from '@/modules/channels/typedefs/channel.typedefs';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class ApiChannelIngressService {
  constructor(
    private readonly channels: ApiChannelIngressRepository,
    private readonly ids: IdService,
  ) {}

  async find(publicChannelId: string): Promise<ApiChannelIngressRecord | null> {
    const channelId = this.ids.tryFromPublic(IdPrefix.Channel, publicChannelId);
    if (channelId === null) {
      return null;
    }
    return this.channels.findById(channelId);
  }
}
