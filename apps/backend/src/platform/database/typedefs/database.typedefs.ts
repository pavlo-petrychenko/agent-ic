import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export type AppDatabase = PostgresJsDatabase;

export type SqlExecutor = Pick<AppDatabase, 'execute'>;
