import { pino, stdTimeFunctions } from 'pino';
import { BaseLauncher } from '@/entrypoints/base.launcher';
import { ConfigLoader } from '@/platform/config/config.loader';
import { MigrationLogMessage } from '@/platform/database/constants/migration.constants';
import { runMigrations } from '@/platform/database/helpers/migration.helpers';

export class MigrationLauncher extends BaseLauncher {
  constructor(private readonly configLoader: ConfigLoader = new ConfigLoader()) {
    super();
  }

  protected async run(): Promise<void> {
    const config = this.configLoader.loadMigration();
    const logger = pino({ level: config.logLevel, timestamp: stdTimeFunctions.isoTime });
    await runMigrations(config.ownerUrl, (notice) => logger.debug(notice));
    logger.info(MigrationLogMessage.Applied);
  }
}
