import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { AgentNotFoundError } from '@/modules/agents/errors/agent-not-found.error';
import { parseAgentInput } from '@/modules/agents/helpers/agent-input.helpers';
import { AgentsRepository } from '@/modules/agents/repositories/agents.repository';
import { agentIdInputSchema } from '@/modules/agents/schemas/agent-input.schema';
import { AgentViewsService } from '@/modules/agents/services/agent-views.service';
import type { AgentIdInput, AgentView } from '@/modules/agents/typedefs/agent.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class ResumeAgentUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly agents: AgentsRepository,
    private readonly clock: ClockService,
    private readonly views: AgentViewsService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: AgentIdInput): Promise<AgentView> {
    const { workspaceId } = authorize(ctx, PermissionResource.Agents, PermissionAction.Publish);
    const { id } = parseAgentInput(agentIdInputSchema, input);
    const agentId = this.ids.fromPublic(IdPrefix.Agent, id);
    const now = this.clock.now();
    return this.tenantTransactions.run(workspaceId, async () => {
      const agent = await this.agents.findByIdForUpdate(workspaceId, agentId);
      if (agent === null) {
        throw new AgentNotFoundError();
      }
      if (agent.pausedAt === null) {
        return this.views.agentView(workspaceId, agent);
      }
      await this.agents.setPause(workspaceId, agentId, null, now);
      return this.views.agentView(workspaceId, {
        ...agent,
        pausedAt: null,
        pauseMode: null,
        awayMessage: null,
        updatedAt: now,
      });
    });
  }
}
