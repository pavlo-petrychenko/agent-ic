import type { TransactionalAdapterDrizzleOrm } from '@nestjs-cls/transactional-adapter-drizzle-orm';
import type { AppDatabase } from '@/platform/database/typedefs/database.typedefs';

export type AfterCommitAction = () => Promise<void>;

export interface AfterCommitBuffer {
  readonly actions: AfterCommitAction[];
  open: boolean;
}

export type DrizzleAdapterOptions = ReturnType<
  TransactionalAdapterDrizzleOrm<AppDatabase>['optionsFactory']
>;

export type TransactionFn = Parameters<DrizzleAdapterOptions['wrapWithTransaction']>[1];
