import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { TENANT_WORKSPACE_CLS_KEY } from '@/platform/database/constants/tenant.constants';
import { TenantMismatchError } from '@/platform/database/errors/tenant-mismatch.error';
import { setWorkspaceStatement } from '@/platform/database/helpers/tenant-sql.helpers';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class TenantTransactionService {
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
