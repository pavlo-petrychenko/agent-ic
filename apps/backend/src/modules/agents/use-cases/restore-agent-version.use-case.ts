import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { AgentVersionKind } from '@/modules/agents/constants/agent.constants';
import { AgentVersionNotFoundError } from '@/modules/agents/errors/agent-version-not-found.error';
import { parseAgentInput } from '@/modules/agents/helpers/agent-input.helpers';
import { AgentVersionsRepository } from '@/modules/agents/repositories/agent-versions.repository';
import { restoreAgentVersionInputSchema } from '@/modules/agents/schemas/agent-input.schema';
import { AgentDraftsService } from '@/modules/agents/services/agent-drafts.service';
import type {
  AgentDraftView,
  RestoreAgentVersionInput,
} from '@/modules/agents/typedefs/agent-version.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class RestoreAgentVersionUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly versions: AgentVersionsRepository,
    private readonly drafts: AgentDraftsService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: RestoreAgentVersionInput): Promise<AgentDraftView> {
    const { userId, workspaceId } = authorize(
      ctx,
      PermissionResource.Agents,
      PermissionAction.Edit,
    );
    const { versionId, revision } = parseAgentInput(restoreAgentVersionInputSchema, input);
    const id = this.ids.fromPublic(IdPrefix.AgentVersion, versionId);
    return this.tenantTransactions.run(workspaceId, async () => {
      const version = await this.versions.findById(workspaceId, id);
      if (version?.kind !== AgentVersionKind.Published) {
        throw new AgentVersionNotFoundError();
      }
      const locked = await this.drafts.lock(workspaceId, version.agentId, revision);
      const restored = await this.drafts.save(workspaceId, locked, {
        flow: version.flow,
        note: locked.draft.note,
        authorId: userId,
      });
      await this.versions.setBaseVersion(workspaceId, locked.draft.id, version.id);
      return restored;
    });
  }
}
