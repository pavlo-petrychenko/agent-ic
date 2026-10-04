import { Module } from '@nestjs/common';
import type { DynamicModule } from '@nestjs/common';
import { APP_MODULES } from '@/app/constants/app-modules.constants';
import { ConfigModule } from '@/platform/config/config.module';
import type { AppConfig } from '@/platform/config/typedefs/app-config.typedefs';
import { importForRole } from '@/platform/module-roles/helpers/module-roles.helpers';
import type { ModuleImport } from '@/platform/module-roles/typedefs/module-roles.typedefs';
import { TracingService } from '@/platform/observability/services/tracing.service';

@Module({})
export class AppModule {
  static forRole(
    config: AppConfig,
    tracing: TracingService,
    modules: readonly ModuleImport[] = APP_MODULES,
  ): DynamicModule {
    return {
      module: AppModule,
      imports: [
        ConfigModule.register(config),
        ...modules.map((entry) => importForRole(entry, config.role)),
      ],
      providers: [{ provide: TracingService, useValue: tracing }],
    };
  }
}
