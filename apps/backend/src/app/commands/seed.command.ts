import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { BaseCommand } from '@/app/commands/base.command';
import { SEED_PRODUCTION_MESSAGE, SEED_ROLE_SELECTION } from '@/app/constants/seed.constants';
import { EnvVar, NodeEnvironment } from '@/platform/config/constants/env.constants';
import { ConfigError } from '@/platform/config/errors/config.error';
import { loadAppConfig } from '@/platform/config/helpers/config.helpers';
import { TracingService } from '@/platform/observability/services/tracing.service';

export class SeedCommand extends BaseCommand {
  protected async run(): Promise<void> {
    const config = loadAppConfig(SEED_ROLE_SELECTION);
    if (config.nodeEnv === NodeEnvironment.Production) {
      throw new ConfigError([{ variable: EnvVar.NodeEnv, message: SEED_PRODUCTION_MESSAGE }]);
    }
    const { AppModule } = await import('@/app/app.module');
    const { seedSampleData } = await import('@/app/helpers/seed.helpers');
    const app = await NestFactory.createApplicationContext(
      AppModule.forRole(config, new TracingService(config.telemetry)),
      { bufferLogs: true },
    );
    try {
      app.useLogger(app.get(Logger));
      await seedSampleData(app);
    } finally {
      await app.close();
    }
  }
}
