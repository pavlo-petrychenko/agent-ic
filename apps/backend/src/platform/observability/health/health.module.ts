import { Module } from '@nestjs/common';
import { HealthController } from '@/platform/observability/health/health.controller';
import { HealthService } from '@/platform/observability/health/health.service';

@Module({
  controllers: [HealthController],
  providers: [HealthService],
  exports: [HealthService],
})
export class HealthModule {}
