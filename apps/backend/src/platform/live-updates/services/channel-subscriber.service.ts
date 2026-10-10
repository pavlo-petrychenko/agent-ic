import { EventEmitter, on } from 'node:events';
import { Injectable } from '@nestjs/common';
import type { OnApplicationShutdown } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { ConfigService } from '@/platform/config/services/config.service';
import { REDIS_MESSAGE_EVENT } from '@/platform/live-updates/constants/channel.constants';
import { RedisConnectionName } from '@/platform/redis/constants/redis.constants';
import {
  closeRedisConnection,
  createRedisConnection,
  withRedisKeyPrefix,
} from '@/platform/redis/helpers/redis.helpers';

@Injectable()
export class ChannelSubscriberService implements OnApplicationShutdown {
  private readonly connection: Redis;
  private readonly keyPrefix: string;
  private readonly messages = new EventEmitter();
  private readonly listeners = new Map<string, number>();

  constructor(config: ConfigService) {
    this.connection = createRedisConnection(
      config.config.redis.queueUrl,
      RedisConnectionName.Subscriber,
    );
    this.keyPrefix = config.config.redis.keyPrefix;
    this.messages.setMaxListeners(0);
    this.connection.on(REDIS_MESSAGE_EVENT, (channel: string, message: string) =>
      this.messages.emit(channel, message),
    );
  }

  async listen(channel: string): Promise<AsyncIterator<unknown[]>> {
    const redisChannel = withRedisKeyPrefix(this.keyPrefix, channel);
    const messages = on(this.messages, redisChannel);
    const count = this.listeners.get(redisChannel) ?? 0;
    this.listeners.set(redisChannel, count + 1);
    if (count === 0) {
      await this.connection.subscribe(redisChannel);
    }
    return messages;
  }

  async release(channel: string): Promise<void> {
    const redisChannel = withRedisKeyPrefix(this.keyPrefix, channel);
    const count = (this.listeners.get(redisChannel) ?? 0) - 1;
    if (count > 0) {
      this.listeners.set(redisChannel, count);
      return;
    }
    this.listeners.delete(redisChannel);
    await this.connection.unsubscribe(redisChannel);
  }

  async onApplicationShutdown(): Promise<void> {
    await closeRedisConnection(this.connection);
  }
}
