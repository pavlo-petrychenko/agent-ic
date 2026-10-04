import { Module } from '@nestjs/common';
import type { DynamicModule, Type } from '@nestjs/common';

import { ClockModule } from '@/platform/clock/clock.module';
import { ConfigModule } from '@/platform/config/config.module';
import { ContextModule } from '@/platform/context/context.module';
import type { AppConfig } from '@/platform/config/config.typedefs';
import { DatabaseModule } from '@/platform/db/database.module';
import { ErrorsModule } from '@/platform/errors/errors.module';
import { IdsModule } from '@/platform/ids/ids.module';
import { TracingModule } from '@/platform/observability/tracing/tracing.module';
import type { TracingService } from '@/platform/observability/tracing/tracing.service';

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
        entrypoint,
      ],
    };
  }
}
