import { Module } from '@nestjs/common';
import { HealthModule } from '@/platform/observability/health/health.module';
import { LoggingModule } from '@/platform/observability/logging/logging.module';
import { MetricsModule } from '@/platform/observability/metrics/metrics.module';

@Module({
  imports: [LoggingModule, HealthModule, MetricsModule],
})
export class ObservabilityModule {}
