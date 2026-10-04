import type { TransactionHost } from '@nestjs-cls/transactional';
import type { TransactionalAdapterDrizzleOrm } from '@nestjs-cls/transactional-adapter-drizzle-orm';
import type { AppDatabase } from '@/platform/database/typedefs/database.typedefs';

export type AppTransactionAdapter = TransactionalAdapterDrizzleOrm<AppDatabase>;

export type AppTransactionHost = TransactionHost<AppTransactionAdapter>;
