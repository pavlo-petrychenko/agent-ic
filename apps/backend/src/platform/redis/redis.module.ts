import { Global, Module } from '@nestjs/common';
import { CacheRedisService } from '@/platform/redis/services/cache-redis.service';

@Global()
@Module({
  providers: [CacheRedisService],
  exports: [CacheRedisService],
})
export class RedisModule {}
