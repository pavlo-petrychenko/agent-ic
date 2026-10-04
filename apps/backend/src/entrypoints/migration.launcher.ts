import { pino, stdTimeFunctions } from 'pino';
import { BaseLauncher } from '@/entrypoints/base.launcher';
import { ConfigLoader } from '@/platform/config/config.loader';
import { MigrationRunner } from '@/platform/db/migrator/migration.runner';
import { MigrationLogMessage } from '@/platform/db/migrator/migrator.constants';

export class MigrationLauncher extends BaseLauncher {
  constructor(private readonly configLoader: ConfigLoader = new ConfigLoader()) {
    super();
  }

  protected async run(): Promise<void> {
    const config = this.configLoader.loadMigration();
    const logger = pino({ level: config.logLevel, timestamp: stdTimeFunctions.isoTime });
    await new MigrationRunner(config.ownerUrl, (notice) => logger.debug(notice)).run();
    logger.info(MigrationLogMessage.Applied);
  }
}
