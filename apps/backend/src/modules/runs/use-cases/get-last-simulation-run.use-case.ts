import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { AgentRuntimeReader, AgentVersionKind } from '@/modules/agents';
import { RunsRepository } from '@/modules/runs/repositories/runs.repository';
import type {
  LastSimulationRunInput,
  SimulationRunSummary,
} from '@/modules/runs/typedefs/run-details.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class GetLastSimulationRunUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly runs: RunsRepository,
    private readonly agents: AgentRuntimeReader,
    private readonly ids: IdService,
  ) {}

  async execute(
    ctx: UseCaseCtx,
    input: LastSimulationRunInput,
  ): Promise<SimulationRunSummary | null> {
    const { workspaceId } = authorize(ctx, PermissionResource.Testing, PermissionAction.View);
    const agentId = this.ids.fromPublic(IdPrefix.Agent, input.agentId);
    return this.tenants.run(workspaceId, async () => {
      const run = await this.runs.findLatestSimulation(workspaceId, agentId);
      if (run === null) {
        return null;
      }
      const version = await this.agents.getVersion(workspaceId, run.versionId);
      return {
        id: this.ids.toPublic(IdPrefix.Run, run.id),
        status: run.status,
        finishedAt: run.finishedAt,
        draftRevision: version.kind === AgentVersionKind.Snapshot ? version.revision : null,
      };
    });
  }
}
