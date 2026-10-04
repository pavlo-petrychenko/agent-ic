import { TransactionalAdapterDrizzleOrm } from '@nestjs-cls/transactional-adapter-drizzle-orm';
import type { DrizzleOrmTransactionalAdapterOptions } from '@nestjs-cls/transactional-adapter-drizzle-orm';
import {
  bindAfterCommitBuffer,
  createAfterCommitBuffer,
  currentAfterCommitBuffer,
  flushAfterCommitBuffer,
  moveAfterCommitBuffer,
  settleTransaction,
} from '@/platform/database/helpers/after-commit.helpers';
import type { AppDatabase } from '@/platform/database/typedefs/database.typedefs';

export class AfterCommitTransactionalAdapterService extends TransactionalAdapterDrizzleOrm<AppDatabase> {
  constructor(options: DrizzleOrmTransactionalAdapterOptions<AppDatabase>) {
    super(options);
    const createOptions = this.optionsFactory;
    this.optionsFactory = (database) => {
      const base = createOptions(database);
      return {
        getFallbackInstance: base.getFallbackInstance,
        wrapWithTransaction: (txOptions, fn, setClient) => {
          const buffer = createAfterCommitBuffer();
          return settleTransaction(
            buffer,
            base.wrapWithTransaction(txOptions, bindAfterCommitBuffer(buffer, fn), setClient),
            () => flushAfterCommitBuffer(buffer),
          );
        },
        wrapWithNestedTransaction: (txOptions, fn, setClient, client) => {
          const parent = currentAfterCommitBuffer();
          const buffer = createAfterCommitBuffer();
          return settleTransaction(
            buffer,
            base.wrapWithNestedTransaction(
              txOptions,
              bindAfterCommitBuffer(buffer, fn),
              setClient,
              client,
            ),
            async () => {
              if (parent === undefined) {
                await flushAfterCommitBuffer(buffer);
                return;
              }
              moveAfterCommitBuffer(buffer, parent);
            },
          );
        },
      };
    };
  }
}
