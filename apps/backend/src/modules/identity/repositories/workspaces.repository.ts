import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { workspaces } from '@/modules/identity/db/workspaces.table';
import type { NewWorkspace, WorkspaceRecord } from '@/modules/identity/typedefs/workspace.typedefs';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class WorkspacesRepository {
  constructor(private readonly txHost: TransactionHost<AppTransactionAdapter>) {}

  async insert(workspace: NewWorkspace): Promise<void> {
    await this.txHost.tx.insert(workspaces).values(workspace);
  }

  async findById(workspaceId: string): Promise<WorkspaceRecord | null> {
    const [workspace] = await this.txHost.tx
      .select()
      .from(workspaces)
      .where(and(eq(workspaces.workspaceId, workspaceId), eq(workspaces.id, workspaceId)));
    return workspace ?? null;
  }
}
