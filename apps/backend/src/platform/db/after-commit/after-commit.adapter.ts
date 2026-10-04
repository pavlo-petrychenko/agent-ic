import { TransactionalAdapterDrizzleOrm } from '@nestjs-cls/transactional-adapter-drizzle-orm';
import type { DrizzleOrmTransactionalAdapterOptions } from '@nestjs-cls/transactional-adapter-drizzle-orm';
import { AfterCommitBuffer } from '@/platform/db/after-commit/after-commit.buffer';
import {
  bindAfterCommitBuffer,
  currentAfterCommitBuffer,
  settleTransaction,
} from '@/platform/db/after-commit/after-commit.helpers';
import type { AppDatabase } from '@/platform/db/database.typedefs';

export class AfterCommitTransactionalAdapter extends TransactionalAdapterDrizzleOrm<AppDatabase> {
  constructor(options: DrizzleOrmTransactionalAdapterOptions<AppDatabase>) {
    super(options);
    const createOptions = this.optionsFactory;
    this.optionsFactory = (database) => {
      const base = createOptions(database);
      return {
        getFallbackInstance: base.getFallbackInstance,
        wrapWithTransaction: (txOptions, fn, setClient) => {
          const buffer = new AfterCommitBuffer();
          return settleTransaction(
            buffer,
            base.wrapWithTransaction(txOptions, bindAfterCommitBuffer(buffer, fn), setClient),
            () => buffer.flush(),
          );
        },
        wrapWithNestedTransaction: (txOptions, fn, setClient, client) => {
          const parent = currentAfterCommitBuffer();
          const buffer = new AfterCommitBuffer();
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
                await buffer.flush();
                return;
              }
              buffer.moveInto(parent);
            },
          );
        },
      };
    };
  }
}
