import { Logger } from '@nestjs/common';
import type { OnApplicationShutdown } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import type { Pool } from 'pg';
import { DatabaseClientLogMessage } from '@/platform/database/constants/database-client.constants';
import { createSqlClient, readPoolStats } from '@/platform/database/helpers/sql-client.helpers';
import type {
  DatabaseClientOptions,
  DatabasePoolStats,
} from '@/platform/database/typedefs/database-client.typedefs';
import type { AppDatabase } from '@/platform/database/typedefs/database.typedefs';

export abstract class DatabaseClientService implements OnApplicationShutdown {
  readonly db: AppDatabase;
  private readonly logger = new Logger(this.constructor.name);
  private readonly pool: Pool;

  constructor(options: DatabaseClientOptions) {
    this.pool = createSqlClient(options, {
      onNotice: (notice) => this.logger.debug(notice),
      onIdleError: (error) =>
        this.logger.error({ msg: DatabaseClientLogMessage.IdleClientError, err: error }),
    });
    this.db = drizzle({ client: this.pool });
  }

  async onApplicationShutdown(): Promise<void> {
    await this.close();
  }

  poolStats(): DatabasePoolStats {
    return readPoolStats(this.pool);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
