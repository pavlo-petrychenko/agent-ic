import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { AgentVersionKind } from '@/modules/agents/constants/agent.constants';
import { AgentNotFoundError } from '@/modules/agents/errors/agent-not-found.error';
import { AgentVersionNotFoundError } from '@/modules/agents/errors/agent-version-not-found.error';
import { parseAgentInput } from '@/modules/agents/helpers/agent-input.helpers';
import { duplicateAgentName } from '@/modules/agents/helpers/agent-name.helpers';
import { toAgentView } from '@/modules/agents/helpers/agent-view.helpers';
import { AgentVersionsRepository } from '@/modules/agents/repositories/agent-versions.repository';
import { AgentsRepository } from '@/modules/agents/repositories/agents.repository';
import { agentIdInputSchema } from '@/modules/agents/schemas/agent-input.schema';
import type { AgentIdInput, AgentView } from '@/modules/agents/typedefs/agent.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class DuplicateAgentUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly agents: AgentsRepository,
    private readonly versions: AgentVersionsRepository,
    private readonly clock: ClockService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: AgentIdInput): Promise<AgentView> {
    const { userId, workspaceId } = authorize(
      ctx,
      PermissionResource.Agents,
      PermissionAction.Edit,
    );
    const { id } = parseAgentInput(agentIdInputSchema, input);
    const sourceId = this.ids.fromPublic(IdPrefix.Agent, id);
    const now = this.clock.now();
    const copyId = this.ids.generate();
    const draftId = this.ids.generate();
    return this.tenantTransactions.run(workspaceId, async () => {
      const source = await this.agents.findById(workspaceId, sourceId);
      if (source === null) {
        throw new AgentNotFoundError();
      }
      const sourceDraft = await this.versions.findDraft(workspaceId, sourceId);
      if (sourceDraft === null) {
        throw new AgentVersionNotFoundError();
      }
      const copy = {
        id: copyId,
        workspaceId,
        name: duplicateAgentName(source.name),
        draftVersionId: draftId,
        liveVersionId: null,
        pausedAt: null,
        pauseMode: null,
        awayMessage: null,
        createdAt: now,
        updatedAt: now,
      };
      await this.agents.insert(copy);
      await this.versions.insert({
        id: draftId,
        workspaceId,
        agentId: copyId,
        kind: AgentVersionKind.Draft,
        flow: sourceDraft.flow,
        note: sourceDraft.note,
        authorId: userId,
        createdAt: now,
        updatedAt: now,
      });
      return toAgentView(copy, this.ids.toPublic(IdPrefix.Agent, copyId));
    });
  }
}
