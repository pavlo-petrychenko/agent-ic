import { Module } from '@nestjs/common';
import type { DynamicModule } from '@nestjs/common';
import { PLATFORM_MODULES, ROLE_MODULES } from '@/app/constants/app-modules.constants';
import { ConfigModule } from '@/platform/config/config.module';
import type { AppConfig } from '@/platform/config/typedefs/app-config.typedefs';
import { importForRole } from '@/platform/module-roles/helpers/module-roles.helpers';
import type { ModuleImport } from '@/platform/module-roles/typedefs/module-roles.typedefs';
import { TracingModule } from '@/platform/observability/tracing/tracing.module';
import type { TracingService } from '@/platform/observability/tracing/tracing.service';

@Module({})
export class AppModule {
  static forRole(
    config: AppConfig,
    tracing: TracingService,
    roleModules: readonly ModuleImport[] = ROLE_MODULES[config.role],
  ): DynamicModule {
    return {
      module: AppModule,
      imports: [
        ConfigModule.register(config),
        TracingModule.register(tracing),
        ...[...PLATFORM_MODULES, ...roleModules].map((entry) => importForRole(entry, config.role)),
      ],
    };
  }
}
