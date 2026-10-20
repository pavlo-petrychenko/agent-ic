import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { and, asc, count, eq, getTableColumns, inArray, sql } from 'drizzle-orm';
import type { ConversationMode } from '@/modules/conversations';
import { FIRST_STEP_ATTEMPT, RunStepStatus } from '@/modules/runs/constants/run.constants';
import { runSteps } from '@/modules/runs/db/run-steps.table';
import { runs } from '@/modules/runs/db/runs.table';
import type {
  NewRunStep,
  RunStep,
  RunStepCount,
  RunStepResult,
} from '@/modules/runs/typedefs/run-step.typedefs';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class RunStepsRepository {
  constructor(private readonly txHost: TransactionHost<AppTransactionAdapter>) {}

  async start(step: NewRunStep): Promise<RunStep | null> {
    const [started] = await this.txHost.tx
      .insert(runSteps)
      .values({ ...step, status: RunStepStatus.Running, attempt: FIRST_STEP_ATTEMPT })
      .onConflictDoUpdate({
        target: [runSteps.runId, runSteps.nodeId, runSteps.branchKey],
        set: {
          attempt: sql`${runSteps.attempt} + 1`,
          input: step.input,
          startedAt: step.startedAt,
        },
        setWhere: eq(runSteps.status, RunStepStatus.Running),
      })
      .returning();
    return started ?? null;
  }

  async finish(workspaceId: string, id: string, result: RunStepResult): Promise<boolean> {
    const finished = await this.txHost.tx
      .update(runSteps)
      .set(result)
      .where(
        and(
          eq(runSteps.workspaceId, workspaceId),
          eq(runSteps.id, id),
          eq(runSteps.status, RunStepStatus.Running),
        ),
      )
      .returning({ id: runSteps.id });
    return finished.length > 0;
  }

  listByRun(workspaceId: string, runId: string): Promise<RunStep[]> {
    return this.txHost.tx
      .select()
      .from(runSteps)
      .where(and(eq(runSteps.workspaceId, workspaceId), eq(runSteps.runId, runId)))
      .orderBy(asc(runSteps.startedAt), asc(runSteps.id));
  }

  async listByRuns(
    workspaceId: string,
    runIds: readonly string[],
    mode: ConversationMode,
  ): Promise<RunStep[]> {
    if (runIds.length === 0) {
      return [];
    }
    return this.txHost.tx
      .select(getTableColumns(runSteps))
      .from(runSteps)
      .innerJoin(runs, eq(runs.id, runSteps.runId))
      .where(
        and(
          eq(runSteps.workspaceId, workspaceId),
          inArray(runSteps.runId, [...runIds]),
          eq(runs.mode, mode),
        ),
      )
      .orderBy(asc(runSteps.startedAt), asc(runSteps.id));
  }

  async countByRuns(workspaceId: string, runIds: readonly string[]): Promise<RunStepCount[]> {
    if (runIds.length === 0) {
      return [];
    }
    return this.txHost.tx
      .select({ runId: runSteps.runId, total: count() })
      .from(runSteps)
      .where(and(eq(runSteps.workspaceId, workspaceId), inArray(runSteps.runId, [...runIds])))
      .groupBy(runSteps.runId);
  }
}
