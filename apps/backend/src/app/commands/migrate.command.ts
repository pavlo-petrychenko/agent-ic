import { pino, stdTimeFunctions } from 'pino';
import { BaseCommand } from '@/app/commands/base.command';
import { loadMigrationConfig } from '@/platform/config/helpers/config.helpers';
import { MigrationRunner } from '@/platform/db/migrator/migration.runner';
import { MigrationLogMessage } from '@/platform/db/migrator/migrator.constants';

export class MigrateCommand extends BaseCommand {
  protected async run(): Promise<void> {
    const config = loadMigrationConfig();
    const logger = pino({ level: config.logLevel, timestamp: stdTimeFunctions.isoTime });
    await new MigrationRunner(config.ownerUrl, (notice) => logger.debug(notice)).run();
    logger.info(MigrationLogMessage.Applied);
  }
}
