import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { AgentVersionKind } from '@/modules/agents/constants/agent.constants';
import { AgentNotFoundError } from '@/modules/agents/errors/agent-not-found.error';
import { AgentVersionAlreadyLiveError } from '@/modules/agents/errors/agent-version-already-live.error';
import { AgentVersionNotFoundError } from '@/modules/agents/errors/agent-version-not-found.error';
import { parseAgentInput } from '@/modules/agents/helpers/agent-input.helpers';
import { rollbackNoteOf } from '@/modules/agents/helpers/agent-version.helpers';
import { AgentVersionsRepository } from '@/modules/agents/repositories/agent-versions.repository';
import { AgentsRepository } from '@/modules/agents/repositories/agents.repository';
import { rollbackAgentInputSchema } from '@/modules/agents/schemas/agent-input.schema';
import { AgentDraftsService } from '@/modules/agents/services/agent-drafts.service';
import { AgentFlowService } from '@/modules/agents/services/agent-flow.service';
import { AgentPublishingService } from '@/modules/agents/services/agent-publishing.service';
import { AgentViewsService } from '@/modules/agents/services/agent-views.service';
import type {
  RollbackAgentInput,
  RolledBackAgent,
} from '@/modules/agents/typedefs/agent-version.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class RollbackAgentUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly agents: AgentsRepository,
    private readonly versions: AgentVersionsRepository,
    private readonly drafts: AgentDraftsService,
    private readonly publishing: AgentPublishingService,
    private readonly flows: AgentFlowService,
    private readonly views: AgentViewsService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: RollbackAgentInput): Promise<RolledBackAgent> {
    authorize(ctx, PermissionResource.Agents, PermissionAction.Edit);
    const { userId, workspaceId } = authorize(
      ctx,
      PermissionResource.Agents,
      PermissionAction.Publish,
    );
    const { versionId, revision, note } = parseAgentInput(rollbackAgentInputSchema, input);
    const id = this.ids.fromPublic(IdPrefix.AgentVersion, versionId);
    return this.tenantTransactions.run(workspaceId, async () => {
      const target = await this.versions.findById(workspaceId, id);
      if (target?.kind !== AgentVersionKind.Published) {
        throw new AgentVersionNotFoundError();
      }
      const locked = await this.drafts.lock(workspaceId, target.agentId, revision);
      if (locked.agent.liveVersionId === target.id) {
        throw new AgentVersionAlreadyLiveError();
      }
      await this.drafts.save(workspaceId, locked, {
        flow: target.flow,
        note: locked.draft.note,
        authorId: userId,
      });
      const version = await this.publishing.publish(workspaceId, target.agentId, {
        authorId: userId,
        note: note ?? rollbackNoteOf(target),
      });
      const agent = await this.agents.findById(workspaceId, target.agentId);
      if (agent === null) {
        throw new AgentNotFoundError();
      }
      const draft = await this.versions.findDraft(workspaceId, target.agentId);
      if (draft === null) {
        throw new AgentVersionNotFoundError();
      }
      return {
        agent: await this.views.agentView(workspaceId, agent),
        version: await this.views.versionView(agent, version),
        draft: {
          version: await this.views.versionView(agent, draft),
          revision: draft.revision,
          savedAt: draft.updatedAt,
          changeCount: await this.views.draftChangeCount(agent, draft),
          issues: this.flows.validate(draft.flow),
        },
      };
    });
  }
}
