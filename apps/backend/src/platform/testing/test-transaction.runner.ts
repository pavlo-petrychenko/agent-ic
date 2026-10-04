import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';

import type { AppTransactionAdapter } from '@/platform/db/database.typedefs';

import { TestRollbackSignal } from './test-rollback.signal';

@Injectable()
export class TestTransactionRunner {
  constructor(private readonly txHost: TransactionHost<AppTransactionAdapter>) {}

  async rollback(work: () => Promise<void>): Promise<void> {
    try {
      await this.txHost.withTransaction(async () => {
        await work();
        throw new TestRollbackSignal();
      });
    } catch (error) {
      if (!(error instanceof TestRollbackSignal)) {
        throw error;
      }
    }
  }
}
