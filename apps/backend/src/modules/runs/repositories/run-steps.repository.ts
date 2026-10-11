import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { and, asc, eq, sql } from 'drizzle-orm';
import { FIRST_STEP_ATTEMPT, RunStepStatus } from '@/modules/runs/constants/run.constants';
import { runSteps } from '@/modules/runs/db/run-steps.table';
import type { NewRunStep, RunStep, RunStepResult } from '@/modules/runs/typedefs/run-step.typedefs';
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
}
