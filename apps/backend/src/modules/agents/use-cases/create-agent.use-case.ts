import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { AgentVersionKind } from '@/modules/agents/constants/agent.constants';
import { initialAgentFlow } from '@/modules/agents/helpers/agent-flow.helpers';
import { parseAgentInput } from '@/modules/agents/helpers/agent-input.helpers';
import { toAgentView } from '@/modules/agents/helpers/agent-view.helpers';
import { AgentVersionsRepository } from '@/modules/agents/repositories/agent-versions.repository';
import { AgentsRepository } from '@/modules/agents/repositories/agents.repository';
import { createAgentInputSchema } from '@/modules/agents/schemas/agent-input.schema';
import type { AgentView, CreateAgentInput } from '@/modules/agents/typedefs/agent.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
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
    private readonly clock: ClockService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: CreateAgentInput): Promise<AgentView> {
    const { userId, workspaceId } = authorize(
      ctx,
      PermissionResource.Agents,
      PermissionAction.Edit,
    );
    const { name } = parseAgentInput(createAgentInputSchema, input);
    const now = this.clock.now();
    const agentId = this.ids.generate();
    const draftId = this.ids.generate();
    const triggerNodeId = this.ids.generate();
    return this.tenantTransactions.run(workspaceId, async () => {
      const agent = {
        id: agentId,
        workspaceId,
        name,
        draftVersionId: draftId,
        liveVersionId: null,
        pausedAt: null,
        pauseMode: null,
        awayMessage: null,
        createdAt: now,
        updatedAt: now,
      };
      await this.agents.insert(agent);
      await this.versions.insert({
        id: draftId,
        workspaceId,
        agentId,
        kind: AgentVersionKind.Draft,
        flow: initialAgentFlow(triggerNodeId),
        authorId: userId,
        createdAt: now,
        updatedAt: now,
      });
      return toAgentView(agent, this.ids.toPublic(IdPrefix.Agent, agentId));
    });
  }
}
