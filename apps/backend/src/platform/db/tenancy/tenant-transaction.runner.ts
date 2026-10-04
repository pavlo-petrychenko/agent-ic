import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { ClsService } from 'nestjs-cls';

import type { AppTransactionAdapter } from '../database.typedefs';
import { TENANT_WORKSPACE_CLS_KEY } from './tenancy.constants';
import { setWorkspaceStatement } from './tenancy.helpers';
import { TenantMismatchError } from './tenant-mismatch.error';

@Injectable()
export class TenantTransactionRunner {
  constructor(
    private readonly txHost: TransactionHost<AppTransactionAdapter>,
    private readonly cls: ClsService,
  ) {}

  run<TResult>(workspaceId: string, work: () => Promise<TResult>): Promise<TResult> {
    return this.txHost.withTransaction(async () => {
      await this.enterWorkspace(workspaceId);
      return work();
    });
  }

  private async enterWorkspace(workspaceId: string): Promise<void> {
    const current = this.cls.get<string | undefined>(TENANT_WORKSPACE_CLS_KEY);
    if (current === workspaceId) {
      return;
    }
    if (current !== undefined) {
      throw new TenantMismatchError(current, workspaceId);
    }
    await this.txHost.tx.execute(setWorkspaceStatement(workspaceId));
    this.cls.set(TENANT_WORKSPACE_CLS_KEY, workspaceId);
  }
}
