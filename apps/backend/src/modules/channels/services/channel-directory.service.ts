import { Injectable } from '@nestjs/common';
import { channelSummaryOf } from '@/modules/channels/helpers/channel-directory.helpers';
import { ChannelsRepository } from '@/modules/channels/repositories/channels.repository';
import type { ChannelSummary } from '@/modules/channels/typedefs/channel.typedefs';

@Injectable()
export class ChannelDirectoryService {
  constructor(private readonly channels: ChannelsRepository) {}

  async findSummary(workspaceId: string, id: string): Promise<ChannelSummary | null> {
    const channel = await this.channels.findById(workspaceId, id);
    return channel === null ? null : channelSummaryOf(channel);
  }
}
