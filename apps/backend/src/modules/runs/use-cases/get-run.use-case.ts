import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { AgentRuntimeReader } from '@/modules/agents';
import { ConversationMode, ConversationRunsService } from '@/modules/conversations';
import { RunNotFoundError } from '@/modules/runs/errors/run-not-found.error';
import { RunStepsRepository } from '@/modules/runs/repositories/run-steps.repository';
import { RunsRepository } from '@/modules/runs/repositories/runs.repository';
import { RunViewsService } from '@/modules/runs/services/run-views.service';
import type { GetRunInput, RunView } from '@/modules/runs/typedefs/run-details.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class GetRunUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly runs: RunsRepository,
    private readonly steps: RunStepsRepository,
    private readonly agents: AgentRuntimeReader,
    private readonly conversations: ConversationRunsService,
    private readonly views: RunViewsService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: GetRunInput): Promise<RunView> {
    const { workspaceId } = authorize(ctx, PermissionResource.Testing, PermissionAction.View);
    const runId = this.ids.fromPublic(IdPrefix.Run, input.id);
    return this.tenants.run(workspaceId, async () => {
      const run = await this.runs.findById(workspaceId, runId);
      if (run?.mode !== ConversationMode.Simulation) {
        throw new RunNotFoundError(input.id);
      }
      const steps = await this.steps.listByRun(workspaceId, runId);
      const version = await this.agents.getVersion(workspaceId, run.versionId);
      const totals = {
        stepsRun: steps.length,
        stepsInFlow: version.flow.nodes.length,
        messagesSent: await this.conversations.countRunMessages(workspaceId, runId),
      };
      return this.views.runView(run, steps, totals);
    });
  }
}
