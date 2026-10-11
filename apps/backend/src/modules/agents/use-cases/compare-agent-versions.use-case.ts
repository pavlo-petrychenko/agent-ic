import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { diffFlows } from '@agent-ic/flow';
import type { FlowDiff } from '@agent-ic/flow';
import { Injectable } from '@nestjs/common';
import { AgentVersionNotFoundError } from '@/modules/agents/errors/agent-version-not-found.error';
import { parseAgentInput } from '@/modules/agents/helpers/agent-input.helpers';
import { AgentVersionsRepository } from '@/modules/agents/repositories/agent-versions.repository';
import { agentVersionDiffInputSchema } from '@/modules/agents/schemas/agent-input.schema';
import type {
  AgentVersion,
  AgentVersionDiffInput,
} from '@/modules/agents/typedefs/agent-version.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class CompareAgentVersionsUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly versions: AgentVersionsRepository,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: AgentVersionDiffInput): Promise<FlowDiff> {
    const { workspaceId } = authorize(ctx, PermissionResource.Agents, PermissionAction.View);
    const { agentId, fromId, toId } = parseAgentInput(agentVersionDiffInputSchema, input);
    const agent = this.ids.fromPublic(IdPrefix.Agent, agentId);
    return this.tenantTransactions.run(workspaceId, async () => {
      const from = await this.agentVersion(workspaceId, agent, fromId);
      const to = await this.agentVersion(workspaceId, agent, toId);
      return diffFlows(from.flow, to.flow);
    });
  }

  private async agentVersion(
    workspaceId: string,
    agentId: string,
    publicId: string,
  ): Promise<AgentVersion> {
    const version = await this.versions.findById(
      workspaceId,
      this.ids.fromPublic(IdPrefix.AgentVersion, publicId),
    );
    if (version?.agentId !== agentId) {
      throw new AgentVersionNotFoundError();
    }
    return version;
  }
}
