import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { and, asc, desc, eq, inArray, isNotNull } from 'drizzle-orm';
import { ConversationMode } from '@/modules/conversations';
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

  listByConversation(workspaceId: string, conversationId: string): Promise<Run[]> {
    return this.txHost.tx
      .select()
      .from(runs)
      .where(and(eq(runs.workspaceId, workspaceId), eq(runs.conversationId, conversationId)))
      .orderBy(asc(runs.createdAt), asc(runs.id));
  }

  async findLatestSimulation(workspaceId: string, agentId: string): Promise<Run | null> {
    const [run] = await this.txHost.tx
      .select()
      .from(runs)
      .where(
        and(
          eq(runs.workspaceId, workspaceId),
          eq(runs.agentId, agentId),
          eq(runs.mode, ConversationMode.Simulation),
        ),
      )
      .orderBy(desc(runs.createdAt), desc(runs.id))
      .limit(1);
    return run ?? null;
  }

  async findLatestFinishedOnVersions(
    workspaceId: string,
    agentId: string,
    versionIds: readonly string[],
  ): Promise<Run | null> {
    if (versionIds.length === 0) {
      return null;
    }
    const [run] = await this.txHost.tx
      .select()
      .from(runs)
      .where(
        and(
          eq(runs.workspaceId, workspaceId),
          eq(runs.agentId, agentId),
          eq(runs.mode, ConversationMode.Simulation),
          inArray(runs.versionId, versionIds),
          isNotNull(runs.finishedAt),
        ),
      )
      .orderBy(desc(runs.finishedAt), desc(runs.id))
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

  async setTraceId(workspaceId: string, id: string, traceId: string | null): Promise<void> {
    await this.txHost.tx
      .update(runs)
      .set({ traceId })
      .where(and(eq(runs.workspaceId, workspaceId), eq(runs.id, id)));
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

  async deleteByWorkspace(workspaceId: string): Promise<void> {
    await this.txHost.tx.delete(runs).where(eq(runs.workspaceId, workspaceId));
  }
}
