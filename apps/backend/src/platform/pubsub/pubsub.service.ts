import { Injectable } from '@nestjs/common';

import { AfterCommitScheduler } from '@/platform/db/after-commit/after-commit.scheduler';

import type { TopicEvent } from './pubsub.typedefs';
import type { Topic } from './topic';
import { TopicIterator } from './topic.iterator';
import { TopicPublisher } from './topic.publisher';
import { TopicSubscriber } from './topic.subscriber';

@Injectable()
export class PubSubService {
  constructor(
    private readonly publisher: TopicPublisher,
    private readonly subscriber: TopicSubscriber,
    private readonly afterCommit: AfterCommitScheduler,
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
