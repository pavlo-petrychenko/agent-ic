import { Module } from '@nestjs/common';
import { MetricsController } from '@/platform/observability/metrics/metrics.controller';
import { MetricsService } from '@/platform/observability/metrics/metrics.service';

@Module({
  controllers: [MetricsController],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}
