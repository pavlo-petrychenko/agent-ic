import { SystemModule } from '@/modules/system';
import { CacheModule } from '@/platform/cache/cache.module';
import { ClockModule } from '@/platform/clock/clock.module';
import { ContextModule } from '@/platform/context/context.module';
import { CryptoModule } from '@/platform/crypto/crypto.module';
import { DatabaseModule } from '@/platform/database/database.module';
import { DomainEventsModule } from '@/platform/domain-events/domain-events.module';
import { ErrorsModule } from '@/platform/errors/errors.module';
import { GraphqlServerModule } from '@/platform/graphql-server/graphql-server.module';
import { IdsModule } from '@/platform/ids/ids.module';
import { LiveUpdatesModule } from '@/platform/live-updates/live-updates.module';
import type { ModuleImport } from '@/platform/module-roles/typedefs/module-roles.typedefs';
import { ObservabilityModule } from '@/platform/observability/observability.module';
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
  LiveUpdatesModule,
  CacheModule,
  RateLimitModule,
  CryptoModule,
  ObservabilityModule,
  GraphqlServerModule,
];

export const DOMAIN_MODULES: readonly ModuleImport[] = [SystemModule];

export const APP_MODULES: readonly ModuleImport[] = [...PLATFORM_MODULES, ...DOMAIN_MODULES];
