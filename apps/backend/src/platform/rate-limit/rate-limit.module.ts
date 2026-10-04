import { Global, Module } from '@nestjs/common';
import { RateLimiterService } from '@/platform/rate-limit/rate-limiter.service';

@Global()
@Module({
  providers: [RateLimiterService],
  exports: [RateLimiterService],
})
export class RateLimitModule {}
