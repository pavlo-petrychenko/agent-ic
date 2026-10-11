import { PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { AgentsRepository } from '@/modules/agents/repositories/agents.repository';
import { AgentViewsService } from '@/modules/agents/services/agent-views.service';
import type { AgentsPage, ListAgentsInput } from '@/modules/agents/typedefs/agent.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { toConnection, toPageRequest } from '@/platform/graphql-server/helpers/relay.helpers';

@Injectable()
export class ListAgentsUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly agents: AgentsRepository,
    private readonly views: AgentViewsService,
  ) {}

  async execute(ctx: UseCaseCtx, input: ListAgentsInput): Promise<AgentsPage> {
    const { workspaceId } = authorize(ctx, PermissionResource.Agents, PermissionAction.View);
    const page = toPageRequest(input);
    return this.tenantTransactions.run(workspaceId, async () => {
      const rows = await this.agents.listPage(workspaceId, page.afterId, page.fetchSize);
      const connection = toConnection(rows, page, (row) => row.id);
      const views = await this.views.agentViews(
        workspaceId,
        connection.edges.map((edge) => edge.node),
      );
      return {
        pageInfo: connection.pageInfo,
        edges: connection.edges.flatMap((edge, index) => {
          const node = views[index];
          return node === undefined ? [] : [{ cursor: edge.cursor, node }];
        }),
      };
    });
  }
}
