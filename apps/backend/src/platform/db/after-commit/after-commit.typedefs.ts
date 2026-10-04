import type { TransactionalAdapterDrizzleOrm } from '@nestjs-cls/transactional-adapter-drizzle-orm';
import type { AppDatabase } from '@/platform/db/database.typedefs';

export type AfterCommitAction = () => Promise<void>;

export type DrizzleAdapterOptions = ReturnType<
  TransactionalAdapterDrizzleOrm<AppDatabase>['optionsFactory']
>;

export type TransactionFn = Parameters<DrizzleAdapterOptions['wrapWithTransaction']>[1];
