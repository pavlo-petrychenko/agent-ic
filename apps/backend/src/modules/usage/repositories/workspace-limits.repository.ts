import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { workspaceLimits } from '@/modules/usage/db/workspace-limits.table';
import type { WorkspaceLimitOverrides } from '@/modules/usage/typedefs/usage.typedefs';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class WorkspaceLimitsRepository {
  constructor(private readonly txHost: TransactionHost<AppTransactionAdapter>) {}

  async find(workspaceId: string): Promise<WorkspaceLimitOverrides | null> {
    const [limits] = await this.txHost.tx
      .select({
        creditsLimit: workspaceLimits.creditsLimit,
        conversationsLimit: workspaceLimits.conversationsLimit,
        chunksLimit: workspaceLimits.chunksLimit,
      })
      .from(workspaceLimits)
      .where(eq(workspaceLimits.workspaceId, workspaceId));
    return limits ?? null;
  }

  async deleteByWorkspace(workspaceId: string): Promise<void> {
    await this.txHost.tx
      .delete(workspaceLimits)
      .where(eq(workspaceLimits.workspaceId, workspaceId));
  }
}
