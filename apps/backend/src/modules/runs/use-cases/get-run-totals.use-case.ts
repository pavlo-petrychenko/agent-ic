import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { AgentRuntimeReader } from '@/modules/agents';
import { ConversationMode, ConversationRunsService } from '@/modules/conversations';
import { NO_RUN_COUNT } from '@/modules/runs/constants/run.constants';
import { RunStepsRepository } from '@/modules/runs/repositories/run-steps.repository';
import { RunsRepository } from '@/modules/runs/repositories/runs.repository';
import type { RunTotals } from '@/modules/runs/typedefs/run-details.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import { indexByKey } from '@/platform/context/helpers/batch.helpers';
import type { BatchUseCase } from '@/platform/context/typedefs/batch-use-case.typedefs';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class GetRunTotalsUseCase implements BatchUseCase<string, RunTotals | null> {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly runs: RunsRepository,
    private readonly steps: RunStepsRepository,
    private readonly agents: AgentRuntimeReader,
    private readonly conversations: ConversationRunsService,
    private readonly ids: IdService,
  ) {}

  async execute(
    ctx: UseCaseCtx,
    keys: readonly string[],
  ): Promise<ReadonlyMap<string, RunTotals | null>> {
    const { workspaceId } = authorize(ctx, PermissionResource.Testing, PermissionAction.View);
    const ids = keys.map((key) => this.ids.fromPublic(IdPrefix.Run, key));
    return this.tenants.run(workspaceId, async () => {
      const runs = await this.runs.listByIds(workspaceId, ids, ConversationMode.Simulation);
      const runIds = runs.map(({ id }) => id);
      const stepCounts = await this.steps.countByRuns(workspaceId, runIds);
      const stepsRun = new Map(stepCounts.map(({ runId, total }) => [runId, total]));
      const versionIds = [...new Set(runs.map(({ versionId }) => versionId))];
      const stepsInFlow = await this.agents.countFlowNodes(workspaceId, versionIds);
      const messagesSent = await this.conversations.countMessagesByRuns(workspaceId, runIds);
      const totals = runs.map(({ id, versionId }) => ({
        runId: this.ids.toPublic(IdPrefix.Run, id),
        totals: {
          stepsRun: stepsRun.get(id) ?? NO_RUN_COUNT,
          stepsInFlow: stepsInFlow.get(versionId) ?? NO_RUN_COUNT,
          messagesSent: messagesSent.get(id) ?? NO_RUN_COUNT,
        },
      }));
      const indexed = indexByKey(keys, totals, ({ runId }) => runId);
      return new Map(Array.from(indexed, ([key, found]) => [key, found?.totals ?? null]));
    });
  }
}
