import { Module } from '@nestjs/common';
import { SystemModule } from '@/modules/system';
import { AdminModule } from '@/platform/admin/admin.module';
import { GraphqlServerModule } from '@/platform/graphql-server/graphql-server.module';
import { Role } from '@/platform/module-roles/constants/role.constants';
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
    SystemModule.forRole(Role.Api),
  ],
})
export class ApiAppModule {}
