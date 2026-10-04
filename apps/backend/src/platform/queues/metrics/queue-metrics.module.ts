import { Module } from '@nestjs/common';
import { MetricsModule } from '@/platform/observability/metrics/metrics.module';
import { QueueMetricsCollector } from '@/platform/queues/metrics/queue-metrics.collector';

@Module({
  imports: [MetricsModule],
  providers: [QueueMetricsCollector],
})
export class QueueMetricsModule {}
