import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { AgentNotFoundError } from '@/modules/agents/errors/agent-not-found.error';
import { parseAgentInput } from '@/modules/agents/helpers/agent-input.helpers';
import { AgentsRepository } from '@/modules/agents/repositories/agents.repository';
import { agentIdInputSchema } from '@/modules/agents/schemas/agent-input.schema';
import type { AgentIdInput } from '@/modules/agents/typedefs/agent.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class DeleteAgentUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly agents: AgentsRepository,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: AgentIdInput): Promise<AgentIdInput> {
    const { workspaceId } = authorize(ctx, PermissionResource.Agents, PermissionAction.Delete);
    const { id } = parseAgentInput(agentIdInputSchema, input);
    const agentId = this.ids.fromPublic(IdPrefix.Agent, id);
    await this.tenantTransactions.run(workspaceId, async () => {
      const agent = await this.agents.findByIdForUpdate(workspaceId, agentId);
      if (agent === null) {
        throw new AgentNotFoundError();
      }
      await this.agents.delete(workspaceId, agentId);
    });
    return { id };
  }
}
