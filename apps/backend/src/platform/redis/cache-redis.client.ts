import { Injectable } from '@nestjs/common';
import type { OnApplicationShutdown } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { ConfigService } from '@/platform/config/services/config.service';
import { RedisConnectionName } from '@/platform/redis/redis.constants';
import { closeRedisConnection, createRedisConnection } from '@/platform/redis/redis.helpers';

@Injectable()
export class CacheRedisClient implements OnApplicationShutdown {
  readonly connection: Redis;

  constructor(config: ConfigService) {
    this.connection = createRedisConnection(
      config.config.redis.cacheUrl,
      RedisConnectionName.Cache,
    );
  }

  async onApplicationShutdown(): Promise<void> {
    await closeRedisConnection(this.connection);
  }
}
