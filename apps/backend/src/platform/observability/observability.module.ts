import { Module } from '@nestjs/common';

import { HealthModule } from './health/health.module';
import { LoggingModule } from './logging/logging.module';
import { MetricsModule } from './metrics/metrics.module';

@Module({
  imports: [LoggingModule, HealthModule, MetricsModule],
})
export class ObservabilityModule {}
