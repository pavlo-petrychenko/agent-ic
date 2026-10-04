import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import type { AppTransactionAdapter } from '@/platform/db/database.typedefs';
import { TestRollbackError } from '@test/support/errors/test-rollback.error';

@Injectable()
export class TestTransactionService {
  constructor(private readonly txHost: TransactionHost<AppTransactionAdapter>) {}

  async rollback(work: () => Promise<void>): Promise<void> {
    try {
      await this.txHost.withTransaction(async () => {
        await work();
        throw new TestRollbackError();
      });
    } catch (error) {
      if (!(error instanceof TestRollbackError)) {
        throw error;
      }
    }
  }
}
