import { Module } from '@nestjs/common';
import type { DynamicModule, Type } from '@nestjs/common';
import { CacheModule } from '@/platform/cache/cache.module';
import { ClockModule } from '@/platform/clock/clock.module';
import { ConfigModule } from '@/platform/config/config.module';
import type { AppConfig } from '@/platform/config/config.typedefs';
import { ContextModule } from '@/platform/context/context.module';
import { CryptoModule } from '@/platform/crypto/crypto.module';
import { DatabaseModule } from '@/platform/database/database.module';
import { DomainEventsModule } from '@/platform/domain-events/domain-events.module';
import { ErrorsModule } from '@/platform/errors/errors.module';
import { IdsModule } from '@/platform/ids/ids.module';
import { TracingModule } from '@/platform/observability/tracing/tracing.module';
import type { TracingService } from '@/platform/observability/tracing/tracing.service';
import { PubSubModule } from '@/platform/pubsub/pubsub.module';
import { QueuesModule } from '@/platform/queues/queues.module';
import { RateLimitModule } from '@/platform/rate-limit/rate-limit.module';
import { RedisModule } from '@/platform/redis/redis.module';

@Module({})
export class RootModule {
  static forRole(
    config: AppConfig,
    tracing: TracingService,
    entrypoint: Type<unknown>,
  ): DynamicModule {
    return {
      module: RootModule,
      imports: [
        ConfigModule.register(config),
        TracingModule.register(tracing),
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
        entrypoint,
      ],
    };
  }
}
