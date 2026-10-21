import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { workspaces } from '@/modules/identity/db/workspaces.table';
import type { NewWorkspace, WorkspaceRecord } from '@/modules/identity/typedefs/workspace.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { storedRow } from '@/platform/database/helpers/stored-row.helpers';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class WorkspacesRepository {
  constructor(
    private readonly txHost: TransactionHost<AppTransactionAdapter>,
    private readonly clock: ClockService,
  ) {}

  async insert(workspace: NewWorkspace): Promise<WorkspaceRecord> {
    const now = this.clock.now();
    return storedRow(
      await this.txHost.tx
        .insert(workspaces)
        .values({ ...workspace, createdAt: now, updatedAt: now })
        .returning(),
    );
  }

  async findById(workspaceId: string): Promise<WorkspaceRecord | null> {
    const [workspace] = await this.txHost.tx
      .select()
      .from(workspaces)
      .where(and(eq(workspaces.workspaceId, workspaceId), eq(workspaces.id, workspaceId)));
    return workspace ?? null;
  }

  async rename(workspaceId: string, name: string): Promise<void> {
    await this.txHost.tx
      .update(workspaces)
      .set({ name, updatedAt: this.clock.now() })
      .where(and(eq(workspaces.workspaceId, workspaceId), eq(workspaces.id, workspaceId)));
  }

  async updateTimeZone(workspaceId: string, timeZone: string): Promise<void> {
    await this.txHost.tx
      .update(workspaces)
      .set({ timeZone, updatedAt: this.clock.now() })
      .where(and(eq(workspaces.workspaceId, workspaceId), eq(workspaces.id, workspaceId)));
  }

  async delete(workspaceId: string): Promise<void> {
    await this.txHost.tx
      .delete(workspaces)
      .where(and(eq(workspaces.workspaceId, workspaceId), eq(workspaces.id, workspaceId)));
  }
}
