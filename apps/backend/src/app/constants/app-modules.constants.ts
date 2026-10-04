import { SystemGraphqlModule } from '@/modules/system/system.graphql-module';
import { AdminModule } from '@/platform/admin/admin.module';
import { CacheModule } from '@/platform/cache/cache.module';
import { ClockModule } from '@/platform/clock/clock.module';
import { ContextModule } from '@/platform/context/context.module';
import { CryptoModule } from '@/platform/crypto/crypto.module';
import { DatabaseModule } from '@/platform/db/database.module';
import { DomainEventsModule } from '@/platform/domain-events/domain-events.module';
import { ErrorsModule } from '@/platform/errors/errors.module';
import { GraphqlServerModule } from '@/platform/graphql/graphql-server.module';
import { IdsModule } from '@/platform/ids/ids.module';
import { Role } from '@/platform/module-roles/constants/role.constants';
import type { ModuleImport } from '@/platform/module-roles/typedefs/module-roles.typedefs';
import { ObservabilityModule } from '@/platform/observability/observability.module';
import { PubSubModule } from '@/platform/pubsub/pubsub.module';
import { QueueBoardModule } from '@/platform/queues/board/queue-board.module';
import { JobWorkersModule } from '@/platform/queues/job-workers.module';
import { QueueMetricsModule } from '@/platform/queues/metrics/queue-metrics.module';
import { QueuesModule } from '@/platform/queues/queues.module';
import { RateLimitModule } from '@/platform/rate-limit/rate-limit.module';
import { RedisModule } from '@/platform/redis/redis.module';

export const PLATFORM_MODULES: readonly ModuleImport[] = [
  ContextModule,
  ErrorsModule,
  DatabaseModule,
  ClockModule,
  IdsModule,
  RedisModule,
  QueuesModule,
  DomainEventsModule,
  PubSubModule,
  CacheModule,
  RateLimitModule,
  CryptoModule,
];

export const ROLE_MODULES: Readonly<Record<Role, readonly ModuleImport[]>> = {
  [Role.Api]: [
    ObservabilityModule,
    AdminModule,
    QueueBoardModule,
    QueueMetricsModule,
    GraphqlServerModule,
    SystemGraphqlModule,
  ],
  [Role.Gateway]: [ObservabilityModule],
  [Role.Worker]: [ObservabilityModule, JobWorkersModule],
};
