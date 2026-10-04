import { Global, Module } from '@nestjs/common';
import { CacheService } from '@/platform/cache/cache.service';

@Global()
@Module({
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
