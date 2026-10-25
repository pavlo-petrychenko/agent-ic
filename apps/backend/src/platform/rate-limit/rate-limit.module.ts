import { Global, Module } from '@nestjs/common';
import { RateLimitMetricsService } from '@/platform/rate-limit/services/rate-limit-metrics.service';
import { RateLimitService } from '@/platform/rate-limit/services/rate-limit.service';

@Global()
@Module({
  providers: [RateLimitService, RateLimitMetricsService],
  exports: [RateLimitService],
})
export class RateLimitModule {}
