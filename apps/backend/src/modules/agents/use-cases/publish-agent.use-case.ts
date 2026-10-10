import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { AgentNotFoundError } from '@/modules/agents/errors/agent-not-found.error';
import { parseAgentInput } from '@/modules/agents/helpers/agent-input.helpers';
import { AgentsRepository } from '@/modules/agents/repositories/agents.repository';
import { publishAgentInputSchema } from '@/modules/agents/schemas/agent-input.schema';
import { AgentPublishingService } from '@/modules/agents/services/agent-publishing.service';
import { AgentViewsService } from '@/modules/agents/services/agent-views.service';
import type { PublishedAgent } from '@/modules/agents/typedefs/agent-version.typedefs';
import type { PublishAgentInput } from '@/modules/agents/typedefs/agent.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class PublishAgentUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly agents: AgentsRepository,
    private readonly publishing: AgentPublishingService,
    private readonly views: AgentViewsService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: PublishAgentInput): Promise<PublishedAgent> {
    const { userId, workspaceId } = authorize(
      ctx,
      PermissionResource.Agents,
      PermissionAction.Publish,
    );
    const { id, note } = parseAgentInput(publishAgentInputSchema, input);
    const agentId = this.ids.fromPublic(IdPrefix.Agent, id);
    return this.tenantTransactions.run(workspaceId, async () => {
      const version = await this.publishing.publish(workspaceId, agentId, {
        authorId: userId,
        note,
      });
      const agent = await this.agents.findById(workspaceId, agentId);
      if (agent === null) {
        throw new AgentNotFoundError();
      }
      return {
        agent: await this.views.agentView(workspaceId, agent),
        version: await this.views.versionView(agent, version),
      };
    });
  }
}
