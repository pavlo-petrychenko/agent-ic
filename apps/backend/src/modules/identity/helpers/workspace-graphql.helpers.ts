import { WorkspaceRole } from '@agent-ic/contracts';
import type {
  InviteInfo,
  InviteLinkView,
  UpdateInviteLinkRoleInput,
} from '@/modules/identity/typedefs/invite-link.typedefs';
import type { MembersPage, RoleMemberCount } from '@/modules/identity/typedefs/membership.typedefs';
import type { WorkspaceMembership } from '@/modules/identity/typedefs/workspace.typedefs';
import type {
  InviteInfo as GraphqlInviteInfo,
  InviteLink as GraphqlInviteLink,
  MemberConnection,
  Membership,
  RoleMemberCount as GraphqlRoleMemberCount,
  UpdateInviteLinkRoleInput as UpdateInviteLinkRoleArgs,
} from '@/platform/graphql-server/generated/schema.generated';
import { WorkspaceRole as GraphqlWorkspaceRole } from '@/platform/graphql-server/generated/schema.generated';

const GRAPHQL_WORKSPACE_ROLE: Readonly<Record<WorkspaceRole, GraphqlWorkspaceRole>> = {
  [WorkspaceRole.Owner]: GraphqlWorkspaceRole.Owner,
  [WorkspaceRole.Admin]: GraphqlWorkspaceRole.Admin,
  [WorkspaceRole.Builder]: GraphqlWorkspaceRole.Builder,
  [WorkspaceRole.Operator]: GraphqlWorkspaceRole.Operator,
};

const WORKSPACE_ROLE_FROM_GRAPHQL: Readonly<Record<GraphqlWorkspaceRole, WorkspaceRole>> = {
  [GraphqlWorkspaceRole.Owner]: WorkspaceRole.Owner,
  [GraphqlWorkspaceRole.Admin]: WorkspaceRole.Admin,
  [GraphqlWorkspaceRole.Builder]: WorkspaceRole.Builder,
  [GraphqlWorkspaceRole.Operator]: WorkspaceRole.Operator,
};

export const toGraphqlMembership = (membership: WorkspaceMembership): Membership => ({
  workspace: membership.workspace,
  role: GRAPHQL_WORKSPACE_ROLE[membership.role],
});

export const toGraphqlInviteLink = (link: InviteLinkView): GraphqlInviteLink => ({
  url: link.url,
  role: GRAPHQL_WORKSPACE_ROLE[link.role],
  expiresAt: link.expiresAt.toISOString(),
  joinedCount: link.joinedCount,
});

export const toGraphqlInviteInfo = (info: InviteInfo): GraphqlInviteInfo => ({
  workspaceName: info.workspaceName,
  inviterName: info.inviterName,
  memberCount: info.memberCount,
  role: GRAPHQL_WORKSPACE_ROLE[info.role],
  expiresAt: info.expiresAt.toISOString(),
});

export const toGraphqlRoleMemberCount = (entry: RoleMemberCount): GraphqlRoleMemberCount => ({
  role: GRAPHQL_WORKSPACE_ROLE[entry.role],
  count: entry.count,
});

export const toGraphqlMemberConnection = (page: MembersPage): MemberConnection => ({
  totalCount: page.totalCount,
  pageInfo: page.members.pageInfo,
  edges: page.members.edges.map((edge) => ({
    cursor: edge.cursor,
    node: {
      id: edge.node.id,
      userId: edge.node.userId,
      name: edge.node.name,
      email: edge.node.email,
      role: GRAPHQL_WORKSPACE_ROLE[edge.node.role],
      lastActiveAt: edge.node.lastActiveAt?.toISOString() ?? null,
      joinedAt: edge.node.joinedAt.toISOString(),
    },
  })),
});

export const toUpdateInviteLinkRoleInput = (
  args: UpdateInviteLinkRoleArgs,
): UpdateInviteLinkRoleInput => ({ role: WORKSPACE_ROLE_FROM_GRAPHQL[args.role] });
