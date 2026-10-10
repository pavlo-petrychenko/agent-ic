import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { AgentNotFoundError } from '@/modules/agents/errors/agent-not-found.error';
import { AgentVersionNotFoundError } from '@/modules/agents/errors/agent-version-not-found.error';
import { parseAgentInput } from '@/modules/agents/helpers/agent-input.helpers';
import { AgentVersionsRepository } from '@/modules/agents/repositories/agent-versions.repository';
import { AgentsRepository } from '@/modules/agents/repositories/agents.repository';
import { agentDraftInputSchema } from '@/modules/agents/schemas/agent-input.schema';
import { AgentFlowService } from '@/modules/agents/services/agent-flow.service';
import { AgentViewsService } from '@/modules/agents/services/agent-views.service';
import type {
  AgentDraftView,
  GetAgentDraftInput,
} from '@/modules/agents/typedefs/agent-version.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class GetAgentDraftUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly agents: AgentsRepository,
    private readonly versions: AgentVersionsRepository,
    private readonly flows: AgentFlowService,
    private readonly views: AgentViewsService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: GetAgentDraftInput): Promise<AgentDraftView> {
    const { workspaceId } = authorize(ctx, PermissionResource.Agents, PermissionAction.View);
    const { agentId: publicId } = parseAgentInput(agentDraftInputSchema, input);
    const agentId = this.ids.fromPublic(IdPrefix.Agent, publicId);
    return this.tenantTransactions.run(workspaceId, async () => {
      const agent = await this.agents.findById(workspaceId, agentId);
      if (agent === null) {
        throw new AgentNotFoundError();
      }
      const draft = await this.versions.findDraft(workspaceId, agentId);
      if (draft === null) {
        throw new AgentVersionNotFoundError();
      }
      return {
        version: await this.views.versionView(agent, draft),
        revision: draft.revision,
        savedAt: draft.updatedAt,
        issues: this.flows.validate(draft.flow),
      };
    });
  }
}
