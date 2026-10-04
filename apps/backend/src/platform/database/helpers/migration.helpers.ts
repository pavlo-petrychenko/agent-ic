import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { CLIENT_CLOSE_TIMEOUT_SECONDS } from '@/platform/database/constants/database-client.constants';
import {
  MIGRATION_POOL_SIZE,
  MIGRATIONS_FOLDER,
  MIGRATIONS_SCHEMA,
  MIGRATIONS_TABLE,
} from '@/platform/database/constants/migration.constants';
import { createSqlClient } from '@/platform/database/helpers/sql-client.helpers';
import type { NoticeHandler } from '@/platform/database/typedefs/database-client.typedefs';

export const runMigrations = async (ownerUrl: string, onNotice: NoticeHandler): Promise<void> => {
  const sql = createSqlClient({ url: ownerUrl, poolMax: MIGRATION_POOL_SIZE }, onNotice);
  try {
    await migrate(drizzle({ client: sql }), {
      migrationsFolder: MIGRATIONS_FOLDER,
      migrationsSchema: MIGRATIONS_SCHEMA,
      migrationsTable: MIGRATIONS_TABLE,
    });
  } finally {
    await sql.end({ timeout: CLIENT_CLOSE_TIMEOUT_SECONDS });
  }
};
