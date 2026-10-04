import { fileURLToPath } from 'node:url';

export const MIGRATIONS_FOLDER = fileURLToPath(new URL('../../../../migrations', import.meta.url));
export const MIGRATIONS_SCHEMA = 'drizzle';
export const MIGRATIONS_TABLE = '__drizzle_migrations';
export const MIGRATION_POOL_SIZE = 1;

export enum MigrationLogMessage {
  Applied = 'migrations applied',
}
