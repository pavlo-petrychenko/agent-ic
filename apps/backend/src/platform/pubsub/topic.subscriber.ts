import { EventEmitter, on } from 'node:events';
import { Injectable } from '@nestjs/common';
import type { OnApplicationShutdown } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { ConfigService } from '@/platform/config/services/config.service';
import { REDIS_MESSAGE_EVENT } from '@/platform/pubsub/pubsub.constants';
import { RedisConnectionName } from '@/platform/redis/constants/redis.constants';
import {
  closeRedisConnection,
  createRedisConnection,
} from '@/platform/redis/helpers/redis.helpers';

@Injectable()
export class TopicSubscriber implements OnApplicationShutdown {
  private readonly connection: Redis;
  private readonly messages = new EventEmitter();
  private readonly listeners = new Map<string, number>();

  constructor(config: ConfigService) {
    this.connection = createRedisConnection(
      config.config.redis.queueUrl,
      RedisConnectionName.Subscriber,
    );
    this.messages.setMaxListeners(0);
    this.connection.on(REDIS_MESSAGE_EVENT, (channel: string, message: string) =>
      this.messages.emit(channel, message),
    );
  }

  async listen(channel: string): Promise<AsyncIterator<unknown[]>> {
    const messages = on(this.messages, channel);
    const count = this.listeners.get(channel) ?? 0;
    this.listeners.set(channel, count + 1);
    if (count === 0) {
      await this.connection.subscribe(channel);
    }
    return messages;
  }

  async release(channel: string): Promise<void> {
    const count = (this.listeners.get(channel) ?? 0) - 1;
    if (count > 0) {
      this.listeners.set(channel, count);
      return;
    }
    this.listeners.delete(channel);
    await this.connection.unsubscribe(channel);
  }

  async onApplicationShutdown(): Promise<void> {
    await closeRedisConnection(this.connection);
  }
}
