import { ErrorReason, IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { AgentField } from '@/modules/agents/constants/agent-input.constants';
import { AgentNotFoundError } from '@/modules/agents/errors/agent-not-found.error';
import { AgentVersionImmutableError } from '@/modules/agents/errors/agent-version-immutable.error';
import { AgentVersionNotFoundError } from '@/modules/agents/errors/agent-version-not-found.error';
import { InvalidAgentInputError } from '@/modules/agents/errors/invalid-agent-input.error';
import { parseAgentInput } from '@/modules/agents/helpers/agent-input.helpers';
import { toAgentVersionView } from '@/modules/agents/helpers/agent-version.helpers';
import { AgentVersionsRepository } from '@/modules/agents/repositories/agent-versions.repository';
import { AgentsRepository } from '@/modules/agents/repositories/agents.repository';
import { saveAgentDraftInputSchema } from '@/modules/agents/schemas/agent-input.schema';
import { AgentFlowService } from '@/modules/agents/services/agent-flow.service';
import type {
  SaveAgentDraftInput,
  SavedAgentDraft,
} from '@/modules/agents/typedefs/agent-version.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class SaveAgentDraftUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly agents: AgentsRepository,
    private readonly versions: AgentVersionsRepository,
    private readonly flows: AgentFlowService,
    private readonly clock: ClockService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: SaveAgentDraftInput): Promise<SavedAgentDraft> {
    const { workspaceId } = authorize(ctx, PermissionResource.Agents, PermissionAction.Edit);
    const { id, flow: flowJson, note } = parseAgentInput(saveAgentDraftInputSchema, input);
    const parsed = this.flows.parse(flowJson);
    if (!parsed.ok) {
      throw new InvalidAgentInputError([
        { path: AgentField.Flow, reason: ErrorReason.InvalidRequest },
      ]);
    }
    const agentId = this.ids.fromPublic(IdPrefix.Agent, id);
    const now = this.clock.now();
    return this.tenantTransactions.run(workspaceId, async () => {
      const agent = await this.agents.findByIdForUpdate(workspaceId, agentId);
      if (agent === null) {
        throw new AgentNotFoundError();
      }
      const draft =
        agent.draftVersionId === null
          ? null
          : await this.versions.findById(workspaceId, agent.draftVersionId);
      if (draft === null) {
        throw new AgentVersionNotFoundError();
      }
      const changes = { flow: parsed.flow, note: note === undefined ? draft.note : note };
      if (!(await this.versions.updateDraft(workspaceId, draft.id, changes, now))) {
        throw new AgentVersionImmutableError();
      }
      return {
        version: toAgentVersionView(
          { ...draft, ...changes, updatedAt: now },
          this.ids.toPublic(IdPrefix.AgentVersion, draft.id),
        ),
        issues: this.flows.validate(parsed.flow),
      };
    });
  }
}
