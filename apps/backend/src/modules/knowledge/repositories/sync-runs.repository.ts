import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { syncRuns } from '@/modules/knowledge/db/sync-runs.table';
import type {
  NewSyncRun,
  SyncRun,
  SyncRunChanges,
} from '@/modules/knowledge/typedefs/sync-run.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { storedRow } from '@/platform/database/helpers/stored-row.helpers';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class SyncRunsRepository {
  constructor(
    private readonly txHost: TransactionHost<AppTransactionAdapter>,
    private readonly clock: ClockService,
  ) {}

  async insert(syncRun: NewSyncRun): Promise<SyncRun> {
    return storedRow(
      await this.txHost.tx
        .insert(syncRuns)
        .values({ ...syncRun, createdAt: this.clock.now() })
        .returning(),
    );
  }

  async findById(workspaceId: string, syncRunId: string): Promise<SyncRun | null> {
    const [syncRun] = await this.txHost.tx
      .select()
      .from(syncRuns)
      .where(and(eq(syncRuns.workspaceId, workspaceId), eq(syncRuns.id, syncRunId)));
    return syncRun ?? null;
  }

  async findLatestBySource(workspaceId: string, sourceId: string): Promise<SyncRun | null> {
    const [syncRun] = await this.txHost.tx
      .select()
      .from(syncRuns)
      .where(and(eq(syncRuns.workspaceId, workspaceId), eq(syncRuns.sourceId, sourceId)))
      .orderBy(desc(syncRuns.createdAt), desc(syncRuns.id))
      .limit(1);
    return syncRun ?? null;
  }

  async update(
    workspaceId: string,
    syncRunId: string,
    changes: SyncRunChanges,
  ): Promise<SyncRun | null> {
    const [syncRun] = await this.txHost.tx
      .update(syncRuns)
      .set(changes)
      .where(and(eq(syncRuns.workspaceId, workspaceId), eq(syncRuns.id, syncRunId)))
      .returning();
    return syncRun ?? null;
  }

  async deleteById(workspaceId: string, syncRunId: string): Promise<boolean> {
    const deleted = await this.txHost.tx
      .delete(syncRuns)
      .where(and(eq(syncRuns.workspaceId, workspaceId), eq(syncRuns.id, syncRunId)))
      .returning({ id: syncRuns.id });
    return deleted.length > 0;
  }
}
