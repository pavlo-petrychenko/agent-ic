import { pino, stdTimeFunctions } from 'pino';
import { BaseCommand } from '@/app/commands/base.command';
import { loadMigrationConfig } from '@/platform/config/helpers/config.helpers';
import { DatabaseClientLogMessage } from '@/platform/database/constants/database-client.constants';
import { MigrationLogMessage } from '@/platform/database/constants/migration.constants';
import { runMigrations } from '@/platform/database/helpers/migration.helpers';

export class MigrateCommand extends BaseCommand {
  protected async run(): Promise<void> {
    const config = loadMigrationConfig();
    const logger = pino({ level: config.logLevel, timestamp: stdTimeFunctions.isoTime });
    await runMigrations(config.ownerUrl, {
      onNotice: (notice) => logger.debug(notice),
      onIdleError: (error) =>
        logger.error({ err: error }, DatabaseClientLogMessage.IdleClientError),
    });
    logger.info(MigrationLogMessage.Applied);
  }
}
