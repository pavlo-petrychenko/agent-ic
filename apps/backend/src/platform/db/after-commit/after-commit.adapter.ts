import { TransactionalAdapterDrizzleOrm } from '@nestjs-cls/transactional-adapter-drizzle-orm';
import type { DrizzleOrmTransactionalAdapterOptions } from '@nestjs-cls/transactional-adapter-drizzle-orm';

import type { AppDatabase } from '../database.typedefs';
import { AfterCommitBuffer } from './after-commit.buffer';
import {
  bindAfterCommitBuffer,
  currentAfterCommitBuffer,
  settleTransaction,
} from './after-commit.helpers';

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
