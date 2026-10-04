import type { TransactionHost } from '@nestjs-cls/transactional';
import type { TransactionalAdapterDrizzleOrm } from '@nestjs-cls/transactional-adapter-drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { Notice } from 'postgres';

export type AppDatabase = PostgresJsDatabase;

export type SqlExecutor = Pick<AppDatabase, 'execute'>;

export type AppTransactionAdapter = TransactionalAdapterDrizzleOrm<AppDatabase>;

export type AppTransactionHost = TransactionHost<AppTransactionAdapter>;

export interface DatabaseClientOptions {
  readonly url: string;
  readonly poolMax: number;
}

export type NoticeHandler = (notice: Notice) => void;
