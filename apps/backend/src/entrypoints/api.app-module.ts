import { Module } from '@nestjs/common';
import { SystemGraphqlModule } from '@/modules/system/system.graphql-module';
import { AdminModule } from '@/platform/admin/admin.module';
import { GraphqlServerModule } from '@/platform/graphql-server/graphql-server.module';
import { ObservabilityModule } from '@/platform/observability/observability.module';
import { QueueBoardModule } from '@/platform/queues/board/queue-board.module';
import { QueueMetricsModule } from '@/platform/queues/metrics/queue-metrics.module';

@Module({
  imports: [
    ObservabilityModule,
    AdminModule,
    QueueBoardModule,
    QueueMetricsModule,
    GraphqlServerModule,
    SystemGraphqlModule,
  ],
})
export class ApiAppModule {}
