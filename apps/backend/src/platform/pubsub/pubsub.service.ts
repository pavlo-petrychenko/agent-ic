import { Injectable } from '@nestjs/common';
import { AfterCommitService } from '@/platform/database/services/after-commit.service';
import type { TopicEvent } from '@/platform/pubsub/pubsub.typedefs';
import type { Topic } from '@/platform/pubsub/topic';
import { TopicIterator } from '@/platform/pubsub/topic.iterator';
import { TopicPublisher } from '@/platform/pubsub/topic.publisher';
import { TopicSubscriber } from '@/platform/pubsub/topic.subscriber';

@Injectable()
export class PubSubService {
  constructor(
    private readonly publisher: TopicPublisher,
    private readonly subscriber: TopicSubscriber,
    private readonly afterCommit: AfterCommitService,
  ) {}

  async publish<TEvent extends TopicEvent>(topic: Topic<TEvent>, event: TEvent): Promise<void> {
    const message = JSON.stringify(topic.schema.parse(event));
    const { channel } = topic;
    await this.afterCommit.schedule(() => this.publisher.publish(channel, message));
  }

  async subscribe<TEvent extends TopicEvent>(
    topic: Topic<TEvent>,
  ): Promise<AsyncIterableIterator<TEvent>> {
    const { channel } = topic;
    const messages = await this.subscriber.listen(channel);
    return new TopicIterator(messages, topic.schema, () => this.subscriber.release(channel));
  }
}
