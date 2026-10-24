import { PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { AgentVersionKind } from '@/modules/agents/constants/agent.constants';
import { AgentNotFoundError } from '@/modules/agents/errors/agent-not-found.error';
import { initialAgentFlow } from '@/modules/agents/helpers/agent-flow.helpers';
import { parseAgentInput } from '@/modules/agents/helpers/agent-input.helpers';
import { uniqueAgentName } from '@/modules/agents/helpers/agent-name.helpers';
import { AgentVersionsRepository } from '@/modules/agents/repositories/agent-versions.repository';
import { AgentsRepository } from '@/modules/agents/repositories/agents.repository';
import { createAgentInputSchema } from '@/modules/agents/schemas/agent-input.schema';
import { AgentViewsService } from '@/modules/agents/services/agent-views.service';
import type { AgentView, CreateAgentInput } from '@/modules/agents/typedefs/agent.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class CreateAgentUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly agents: AgentsRepository,
    private readonly versions: AgentVersionsRepository,
    private readonly views: AgentViewsService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: CreateAgentInput): Promise<AgentView> {
    const { userId, workspaceId } = authorize(
      ctx,
      PermissionResource.Agents,
      PermissionAction.Edit,
    );
    const { name } = parseAgentInput(createAgentInputSchema, input);
    const agentId = this.ids.generate();
    const draftId = this.ids.generate();
    const triggerNodeId = this.ids.generate();
    return this.tenantTransactions.run(workspaceId, async () => {
      await this.agents.lockNames(workspaceId);
      const takenNames = await this.agents.findNamesStartingWith(workspaceId, name);
      await this.agents.insert({
        id: agentId,
        workspaceId,
        name: uniqueAgentName(name, takenNames),
        description: null,
        draftVersionId: null,
        liveVersionId: null,
        pausedAt: null,
        pauseMode: null,
        awayMessage: null,
      });
      await this.versions.insert({
        id: draftId,
        workspaceId,
        agentId,
        kind: AgentVersionKind.Draft,
        flow: initialAgentFlow(triggerNodeId),
        authorId: userId,
      });
      const agent = await this.agents.setDraftVersion(workspaceId, agentId, draftId);
      if (agent === null) {
        throw new AgentNotFoundError();
      }
      return this.views.agentView(workspaceId, agent);
    });
  }
}
