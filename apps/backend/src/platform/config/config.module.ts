import { Module } from '@nestjs/common';
import type { DynamicModule } from '@nestjs/common';
import { ConfigService } from '@/platform/config/services/config.service';
import type { AppConfig } from '@/platform/config/typedefs/app-config.typedefs';

@Module({})
export class ConfigModule {
  static register(config: AppConfig): DynamicModule {
    return {
      module: ConfigModule,
      global: true,
      providers: [{ provide: ConfigService, useValue: new ConfigService(config) }],
      exports: [ConfigService],
    };
  }
}
