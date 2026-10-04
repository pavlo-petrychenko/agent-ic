import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { CLIENT_CLOSE_TIMEOUT_SECONDS } from '@/platform/db/database.constants';
import { createSqlClient } from '@/platform/db/database.helpers';
import type { NoticeHandler } from '@/platform/db/database.typedefs';
import {
  MIGRATION_POOL_SIZE,
  MIGRATIONS_FOLDER,
  MIGRATIONS_SCHEMA,
  MIGRATIONS_TABLE,
} from '@/platform/db/migrator/migrator.constants';

export class MigrationRunner {
  constructor(
    private readonly ownerUrl: string,
    private readonly onNotice: NoticeHandler,
  ) {}

  async run(): Promise<void> {
    const sql = createSqlClient(
      { url: this.ownerUrl, poolMax: MIGRATION_POOL_SIZE },
      this.onNotice,
    );
    try {
      await migrate(drizzle({ client: sql }), {
        migrationsFolder: MIGRATIONS_FOLDER,
        migrationsSchema: MIGRATIONS_SCHEMA,
        migrationsTable: MIGRATIONS_TABLE,
      });
    } finally {
      await sql.end({ timeout: CLIENT_CLOSE_TIMEOUT_SECONDS });
    }
  }
}
