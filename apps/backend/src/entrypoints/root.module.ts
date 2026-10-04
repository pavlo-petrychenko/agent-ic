import { Module } from '@nestjs/common';
import type { DynamicModule, Type } from '@nestjs/common';

import { ConfigModule } from '@/platform/config/config.module';
import type { AppConfig } from '@/platform/config/config.typedefs';
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
      imports: [ConfigModule.register(config), TracingModule.register(tracing), entrypoint],
    };
  }
}
