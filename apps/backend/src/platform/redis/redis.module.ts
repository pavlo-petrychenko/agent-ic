import { Global, Module } from '@nestjs/common';

import { CacheRedisClient } from './cache-redis.client';

@Global()
@Module({
  providers: [CacheRedisClient],
  exports: [CacheRedisClient],
})
export class RedisModule {}
