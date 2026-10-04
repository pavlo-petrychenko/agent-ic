import { Module } from '@nestjs/common';

import { MetricsModule } from '@/platform/observability/metrics/metrics.module';

import { QueueMetricsCollector } from './queue-metrics.collector';

@Module({
  imports: [MetricsModule],
  providers: [QueueMetricsCollector],
})
export class QueueMetricsModule {}
