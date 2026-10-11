import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { RunStatus, UNFINISHED_RUN_STATUSES } from '@/modules/runs/constants/run.constants';
import { runs } from '@/modules/runs/db/runs.table';
import type { NewRun, Run, RunEnd } from '@/modules/runs/typedefs/run.typedefs';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class RunsRepository {
  constructor(private readonly txHost: TransactionHost<AppTransactionAdapter>) {}

  async insert(run: NewRun): Promise<void> {
    await this.txHost.tx.insert(runs).values(run);
  }

  async findById(workspaceId: string, id: string): Promise<Run | null> {
    const [run] = await this.txHost.tx
      .select()
      .from(runs)
      .where(and(eq(runs.workspaceId, workspaceId), eq(runs.id, id)));
    return run ?? null;
  }

  async findLatestByConversation(workspaceId: string, conversationId: string): Promise<Run | null> {
    const [run] = await this.txHost.tx
      .select()
      .from(runs)
      .where(and(eq(runs.workspaceId, workspaceId), eq(runs.conversationId, conversationId)))
      .orderBy(desc(runs.createdAt), desc(runs.id))
      .limit(1);
    return run ?? null;
  }

  async markRunning(workspaceId: string, id: string, startedAt: Date): Promise<boolean> {
    const started = await this.txHost.tx
      .update(runs)
      .set({ status: RunStatus.Running, startedAt })
      .where(
        and(eq(runs.workspaceId, workspaceId), eq(runs.id, id), eq(runs.status, RunStatus.Queued)),
      )
      .returning({ id: runs.id });
    return started.length > 0;
  }

  async finish(workspaceId: string, id: string, end: RunEnd): Promise<boolean> {
    const finished = await this.txHost.tx
      .update(runs)
      .set({ status: end.status, error: end.error, finishedAt: end.finishedAt })
      .where(
        and(
          eq(runs.workspaceId, workspaceId),
          eq(runs.id, id),
          inArray(runs.status, UNFINISHED_RUN_STATUSES),
        ),
      )
      .returning({ id: runs.id });
    return finished.length > 0;
  }
}
