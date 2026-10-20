import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { AgentsRepository } from '@/modules/agents/repositories/agents.repository';
import { AgentViewsService } from '@/modules/agents/services/agent-views.service';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import { indexByKey } from '@/platform/context/helpers/batch.helpers';
import type { BatchUseCase } from '@/platform/context/typedefs/batch-use-case.typedefs';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class CountDraftChangesUseCase implements BatchUseCase<string, number | null> {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly agents: AgentsRepository,
    private readonly views: AgentViewsService,
    private readonly ids: IdService,
  ) {}

  async execute(
    ctx: UseCaseCtx,
    keys: readonly string[],
  ): Promise<ReadonlyMap<string, number | null>> {
    const { workspaceId } = authorize(ctx, PermissionResource.Agents, PermissionAction.View);
    const agentIds = keys.map((key) => this.ids.fromPublic(IdPrefix.Agent, key));
    const counts = await this.tenants.run(workspaceId, async () =>
      this.views.draftChangeCounts(workspaceId, await this.agents.listByIds(workspaceId, agentIds)),
    );
    const indexed = indexByKey(keys, counts, ({ agentId }) =>
      this.ids.toPublic(IdPrefix.Agent, agentId),
    );
    return new Map(Array.from(indexed, ([key, found]) => [key, found?.changeCount ?? null]));
  }
}
