import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { AgentNotFoundError } from '@/modules/agents/errors/agent-not-found.error';
import { parseAgentInput } from '@/modules/agents/helpers/agent-input.helpers';
import { toAgentVersionView } from '@/modules/agents/helpers/agent-version.helpers';
import { AgentVersionsRepository } from '@/modules/agents/repositories/agent-versions.repository';
import { AgentsRepository } from '@/modules/agents/repositories/agents.repository';
import { listAgentVersionsInputSchema } from '@/modules/agents/schemas/agent-input.schema';
import type {
  AgentVersionView,
  ListAgentVersionsInput,
} from '@/modules/agents/typedefs/agent-version.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class ListAgentVersionsUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly agents: AgentsRepository,
    private readonly versions: AgentVersionsRepository,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: ListAgentVersionsInput): Promise<AgentVersionView[]> {
    const { workspaceId } = authorize(ctx, PermissionResource.Agents, PermissionAction.View);
    const { agentId: publicId } = parseAgentInput(listAgentVersionsInputSchema, input);
    const agentId = this.ids.fromPublic(IdPrefix.Agent, publicId);
    return this.tenantTransactions.run(workspaceId, async () => {
      if ((await this.agents.findById(workspaceId, agentId)) === null) {
        throw new AgentNotFoundError();
      }
      const rows = await this.versions.listPublished(workspaceId, agentId);
      return rows.map((row) =>
        toAgentVersionView(row, this.ids.toPublic(IdPrefix.AgentVersion, row.id)),
      );
    });
  }
}
