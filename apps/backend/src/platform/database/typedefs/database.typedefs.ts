import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

export type AppDatabase = NodePgDatabase;

export type SqlExecutor = Pick<AppDatabase, 'execute'>;
