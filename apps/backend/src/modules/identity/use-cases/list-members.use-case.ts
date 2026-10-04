import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { MembershipsRepository } from '@/modules/identity/repositories/memberships.repository';
import type {
  ListMembersInput,
  Member,
  MemberRow,
  MembersPage,
} from '@/modules/identity/typedefs/membership.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { toConnection, toPageRequest } from '@/platform/graphql-server/helpers/relay.helpers';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class ListMembersUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly memberships: MembershipsRepository,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: ListMembersInput): Promise<MembersPage> {
    const { workspaceId } = authorize(ctx, PermissionResource.Team, PermissionAction.View);
    const page = toPageRequest(input);
    return this.tenantTransactions.run(workspaceId, async () => {
      const rows = await this.memberships.listPage(workspaceId, page.afterId, page.fetchSize);
      const connection = toConnection(rows, page, (row) => row.membershipId);
      return {
        members: {
          pageInfo: connection.pageInfo,
          edges: connection.edges.map((edge) => ({
            cursor: edge.cursor,
            node: this.toMember(edge.node),
          })),
        },
        totalCount: await this.memberships.countByWorkspace(workspaceId),
      };
    });
  }

  private toMember(row: MemberRow): Member {
    return {
      id: this.ids.toPublic(IdPrefix.Membership, row.membershipId),
      userId: this.ids.toPublic(IdPrefix.User, row.userId),
      name: row.name,
      email: row.email,
      role: row.role,
      lastActiveAt: row.lastActiveAt,
      joinedAt: row.joinedAt,
    };
  }
}
