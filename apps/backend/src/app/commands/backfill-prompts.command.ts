import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { BaseCommand } from '@/app/commands/base.command';
import { BACKFILL_ROLE_SELECTION } from '@/app/constants/backfill.constants';
import { loadAppConfig } from '@/platform/config/helpers/config.helpers';
import { TracingService } from '@/platform/observability/services/tracing.service';

export class BackfillPromptsCommand extends BaseCommand {
  protected async run(): Promise<void> {
    const config = loadAppConfig(BACKFILL_ROLE_SELECTION);
    const { AppModule } = await import('@/app/app.module');
    const { backfillInlinePrompts } = await import('@/app/helpers/prompt-backfill.helpers');
    const app = await NestFactory.createApplicationContext(
      AppModule.forRole(config, new TracingService(config.telemetry)),
      { bufferLogs: true },
    );
    try {
      app.useLogger(app.get(Logger));
      await backfillInlinePrompts(app);
    } finally {
      await app.close();
    }
  }
}
