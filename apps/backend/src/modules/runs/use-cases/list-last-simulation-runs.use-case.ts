import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { AgentRuntimeReader, AgentVersionKind } from '@/modules/agents';
import { RunsRepository } from '@/modules/runs/repositories/runs.repository';
import type { SimulationRunSummary } from '@/modules/runs/typedefs/run-details.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import { indexByKey } from '@/platform/context/helpers/batch.helpers';
import type { BatchUseCase } from '@/platform/context/typedefs/batch-use-case.typedefs';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class ListLastSimulationRunsUseCase implements BatchUseCase<
  string,
  SimulationRunSummary | null
> {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly runs: RunsRepository,
    private readonly agents: AgentRuntimeReader,
    private readonly ids: IdService,
  ) {}

  async execute(
    ctx: UseCaseCtx,
    keys: readonly string[],
  ): Promise<ReadonlyMap<string, SimulationRunSummary | null>> {
    const { workspaceId } = authorize(ctx, PermissionResource.Testing, PermissionAction.View);
    const agentIds = keys.map((key) => this.ids.fromPublic(IdPrefix.Agent, key));
    return this.tenants.run(workspaceId, async () => {
      const runs = await this.runs.findLatestSimulations(workspaceId, agentIds);
      const versionIds = [...new Set(runs.map(({ versionId }) => versionId))];
      const versions = await this.agents.getVersions(workspaceId, versionIds);
      const summaries = runs.map((run) => {
        const version = versions.get(run.versionId);
        return {
          agentId: this.ids.toPublic(IdPrefix.Agent, run.agentId),
          summary: {
            id: this.ids.toPublic(IdPrefix.Run, run.id),
            status: run.status,
            finishedAt: run.finishedAt,
            draftRevision: version?.kind === AgentVersionKind.Snapshot ? version.revision : null,
          },
        };
      });
      const indexed = indexByKey(keys, summaries, ({ agentId }) => agentId);
      return new Map(Array.from(indexed, ([key, found]) => [key, found?.summary ?? null]));
    });
  }
}
