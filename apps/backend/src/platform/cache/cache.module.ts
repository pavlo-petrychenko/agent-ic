import { Global, Module } from '@nestjs/common';
import { CacheMetricsService } from '@/platform/cache/services/cache-metrics.service';
import { CacheService } from '@/platform/cache/services/cache.service';

@Global()
@Module({
  providers: [CacheService, CacheMetricsService],
  exports: [CacheService],
})
export class CacheModule {}
