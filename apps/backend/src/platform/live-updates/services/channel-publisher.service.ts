import { Injectable } from '@nestjs/common';
import type { OnApplicationShutdown } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { ConfigService } from '@/platform/config/services/config.service';
import { RedisConnectionName } from '@/platform/redis/constants/redis.constants';
import {
  closeRedisConnection,
  createRedisConnection,
  withRedisKeyPrefix,
} from '@/platform/redis/helpers/redis.helpers';

@Injectable()
export class ChannelPublisherService implements OnApplicationShutdown {
  private readonly connection: Redis;
  private readonly keyPrefix: string;

  constructor(config: ConfigService) {
    this.connection = createRedisConnection(
      config.config.redis.queueUrl,
      RedisConnectionName.Publisher,
    );
    this.keyPrefix = config.config.redis.keyPrefix;
  }

  async publish(channel: string, message: string): Promise<void> {
    await this.connection.publish(withRedisKeyPrefix(this.keyPrefix, channel), message);
  }

  async onApplicationShutdown(): Promise<void> {
    await closeRedisConnection(this.connection);
  }
}
