import { Global, Module } from '@nestjs/common';
import { RateLimitService } from '@/platform/rate-limit/services/rate-limit.service';

@Global()
@Module({
  providers: [RateLimitService],
  exports: [RateLimitService],
})
export class RateLimitModule {}
