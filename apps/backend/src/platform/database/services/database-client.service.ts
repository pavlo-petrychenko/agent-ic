import { Logger } from '@nestjs/common';
import type { OnApplicationShutdown } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/postgres-js';
import type { Sql } from 'postgres';
import { CLIENT_CLOSE_TIMEOUT_SECONDS } from '@/platform/database/constants/database-client.constants';
import { createSqlClient } from '@/platform/database/helpers/sql-client.helpers';
import type { DatabaseClientOptions } from '@/platform/database/typedefs/database-client.typedefs';
import type { AppDatabase } from '@/platform/database/typedefs/database.typedefs';

export abstract class DatabaseClientService implements OnApplicationShutdown {
  readonly db: AppDatabase;
  private readonly logger = new Logger(this.constructor.name);
  private readonly sql: Sql;

  constructor(options: DatabaseClientOptions) {
    this.sql = createSqlClient(options, (notice) => this.logger.debug(notice));
    this.db = drizzle({ client: this.sql });
  }

  async onApplicationShutdown(): Promise<void> {
    await this.close();
  }

  async close(): Promise<void> {
    await this.sql.end({ timeout: CLIENT_CLOSE_TIMEOUT_SECONDS });
  }
}
