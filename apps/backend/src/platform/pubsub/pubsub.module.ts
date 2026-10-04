import { Global, Module } from '@nestjs/common';
import { PubSubService } from '@/platform/pubsub/pubsub.service';
import { TopicPublisher } from '@/platform/pubsub/topic.publisher';
import { TopicSubscriber } from '@/platform/pubsub/topic.subscriber';

@Global()
@Module({
  providers: [TopicPublisher, TopicSubscriber, PubSubService],
  exports: [PubSubService],
})
export class PubSubModule {}
