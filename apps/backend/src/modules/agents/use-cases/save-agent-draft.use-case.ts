import { ErrorReason, IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { AgentField } from '@/modules/agents/constants/agent-input.constants';
import { InvalidAgentInputError } from '@/modules/agents/errors/invalid-agent-input.error';
import { parseAgentInput } from '@/modules/agents/helpers/agent-input.helpers';
import { saveAgentDraftInputSchema } from '@/modules/agents/schemas/agent-input.schema';
import { AgentDraftsService } from '@/modules/agents/services/agent-drafts.service';
import { AgentFlowService } from '@/modules/agents/services/agent-flow.service';
import type {
  AgentDraftView,
  SaveAgentDraftInput,
} from '@/modules/agents/typedefs/agent-version.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class SaveAgentDraftUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly drafts: AgentDraftsService,
    private readonly flows: AgentFlowService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: SaveAgentDraftInput): Promise<AgentDraftView> {
    const { userId, workspaceId } = authorize(
      ctx,
      PermissionResource.Agents,
      PermissionAction.Edit,
    );
    const {
      id,
      flow: flowJson,
      note,
      revision,
    } = parseAgentInput(saveAgentDraftInputSchema, input);
    const parsed = this.flows.parse(flowJson);
    if (!parsed.ok) {
      throw new InvalidAgentInputError([
        { path: AgentField.Flow, reason: ErrorReason.InvalidRequest },
      ]);
    }
    const agentId = this.ids.fromPublic(IdPrefix.Agent, id);
    return this.tenantTransactions.run(workspaceId, async () => {
      const locked = await this.drafts.lock(workspaceId, agentId, revision);
      return this.drafts.save(workspaceId, locked, {
        flow: parsed.flow,
        note: note === undefined ? locked.draft.note : note,
        authorId: userId,
      });
    });
  }
}
