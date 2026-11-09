import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { AgentsRepository } from '@/modules/agents/repositories/agents.repository';
import type { InboxFilterOptionView } from '@/modules/agents/typedefs/inbox-filter-option.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { BatchUseCase } from '@/platform/context/typedefs/batch-use-case.typedefs';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class GetInboxAgentOptionsUseCase implements BatchUseCase<
  string,
  InboxFilterOptionView | null
> {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly agents: AgentsRepository,
    private readonly ids: IdService,
  ) {}

  execute(
    ctx: UseCaseCtx,
    keys: readonly string[],
  ): Promise<ReadonlyMap<string, InboxFilterOptionView | null>> {
    const { workspaceId } = authorize(ctx, PermissionResource.Inbox, PermissionAction.View);
    return this.tenants.run(workspaceId, async () => {
      const agents = await this.agents.listByIds(workspaceId, keys);
      const byId = new Map(agents.map((agent) => [agent.id, agent]));
      return new Map(
        keys.map((key) => {
          const agent = byId.get(key);
          return [
            key,
            agent === undefined
              ? null
              : { id: this.ids.toPublic(IdPrefix.Agent, key), name: agent.name },
          ];
        }),
      );
    });
  }
}
