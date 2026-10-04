import { Injectable } from '@nestjs/common';
import { AfterCommitScheduler } from '@/platform/db/after-commit/after-commit.scheduler';
import { channelStream } from '@/platform/live-updates/helpers/channel-stream.helpers';
import { ChannelPublisherService } from '@/platform/live-updates/services/channel-publisher.service';
import { ChannelSubscriberService } from '@/platform/live-updates/services/channel-subscriber.service';
import type { Channel, ChannelEvent } from '@/platform/live-updates/typedefs/channel.typedefs';

@Injectable()
export class LiveUpdatesService {
  constructor(
    private readonly publisher: ChannelPublisherService,
    private readonly subscriber: ChannelSubscriberService,
    private readonly afterCommit: AfterCommitScheduler,
  ) {}

  async publish<TEvent extends ChannelEvent>(
    channel: Channel<TEvent>,
    event: TEvent,
  ): Promise<void> {
    const message = JSON.stringify(channel.schema.parse(event));
    const { key } = channel;
    await this.afterCommit.schedule(() => this.publisher.publish(key, message));
  }

  async subscribe<TEvent extends ChannelEvent>(
    channel: Channel<TEvent>,
  ): Promise<AsyncGenerator<TEvent, void, undefined>> {
    const { key } = channel;
    const messages = await this.subscriber.listen(key);
    return channelStream(messages, channel.schema, () => this.subscriber.release(key));
  }
}
