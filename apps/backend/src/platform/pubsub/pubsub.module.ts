import { Global, Module } from '@nestjs/common';

import { PubSubService } from './pubsub.service';
import { TopicPublisher } from './topic.publisher';
import { TopicSubscriber } from './topic.subscriber';

@Global()
@Module({
  providers: [TopicPublisher, TopicSubscriber, PubSubService],
  exports: [PubSubService],
})
export class PubSubModule {}
