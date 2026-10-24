import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { MIGRATION_APPLICATION_NAME } from '@/platform/database/constants/database-client.constants';
import {
  MIGRATION_POOL_SIZE,
  MIGRATIONS_FOLDER,
  MIGRATIONS_SCHEMA,
  MIGRATIONS_TABLE,
} from '@/platform/database/constants/migration.constants';
import { createSqlClient } from '@/platform/database/helpers/sql-client.helpers';
import type { DatabaseClientListeners } from '@/platform/database/typedefs/database-client.typedefs';

export const runMigrations = async (
  ownerUrl: string,
  listeners: DatabaseClientListeners,
): Promise<void> => {
  const pool = createSqlClient(
    { url: ownerUrl, poolMax: MIGRATION_POOL_SIZE, applicationName: MIGRATION_APPLICATION_NAME },
    listeners,
  );
  try {
    await migrate(drizzle({ client: pool }), {
      migrationsFolder: MIGRATIONS_FOLDER,
      migrationsSchema: MIGRATIONS_SCHEMA,
      migrationsTable: MIGRATIONS_TABLE,
    });
  } finally {
    await pool.end();
  }
};
