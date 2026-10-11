import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { toAgentView } from '@/modules/agents/helpers/agent-view.helpers';
import { AgentsRepository } from '@/modules/agents/repositories/agents.repository';
import type { AgentsPage, ListAgentsInput } from '@/modules/agents/typedefs/agent.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { toConnection, toPageRequest } from '@/platform/graphql-server/helpers/relay.helpers';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class ListAgentsUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly agents: AgentsRepository,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: ListAgentsInput): Promise<AgentsPage> {
    const { workspaceId } = authorize(ctx, PermissionResource.Agents, PermissionAction.View);
    const page = toPageRequest(input);
    return this.tenantTransactions.run(workspaceId, async () => {
      const rows = await this.agents.listPage(workspaceId, page.afterId, page.fetchSize);
      const connection = toConnection(rows, page, (row) => row.id);
      return {
        pageInfo: connection.pageInfo,
        edges: connection.edges.map((edge) => ({
          cursor: edge.cursor,
          node: toAgentView(edge.node, this.ids.toPublic(IdPrefix.Agent, edge.node.id)),
        })),
      };
    });
  }
}
