import { PERMISSION_MATRIX, WorkspaceRole } from '@agent-ic/contracts';
import type { PermissionAction, PermissionResource } from '@agent-ic/contracts';
import type { MockLink } from '@apollo/client/testing';
import { ChangeMemberRoleDocument } from '@/features/settings/communication/gql/mutation/changeMemberRole.generated';
import { RemoveMemberDocument } from '@/features/settings/communication/gql/mutation/removeMember.generated';
import { ResetInviteLinkDocument } from '@/features/settings/communication/gql/mutation/resetInviteLink.generated';
import { InviteLinkDocument } from '@/features/settings/communication/gql/query/inviteLink.generated';
import { RolesDocument } from '@/features/settings/communication/gql/query/roles.generated';
import { TeamMembersDocument } from '@/features/settings/communication/gql/query/teamMembers.generated';
import { MEMBERS_PAGE_SIZE } from '@/features/settings/constants/member.constants';
import { ACTION_TO_API, RESOURCE_TO_API } from '@/shared/api/constants/permission.constants';

export const INVITE_URL = 'https://app.example/invite/first-token';
export const RESET_INVITE_URL = 'https://app.example/invite/second-token';

const inviteLink = (url: string) => ({
  __typename: 'InviteLink',
  url,
  role: 'operator',
  roleId: 'rol_operator',
  expiresAt: '2026-10-16T12:00:00.000Z',
  joinedCount: 1,
});

const rolePermissions = (key: WorkspaceRole) =>
  (Object.keys(PERMISSION_MATRIX[key]) as PermissionResource[]).flatMap((resource) =>
    PERMISSION_MATRIX[key][resource].map((action: PermissionAction) => ({
      __typename: 'RolePermission',
      resource: RESOURCE_TO_API[resource],
      action: ACTION_TO_API[action],
    })),
  );

const roleNode = (id: string, key: WorkspaceRole, name: string | null, isSystem: boolean) => ({
  __typename: 'Role',
  id,
  key,
  name,
  isSystem,
  memberCount: 0,
  permissions: rolePermissions(key),
});

export const buildRolesMock = (): MockLink.MockedResponse => ({
  request: { query: RolesDocument },
  result: {
    data: {
      roles: [
        roleNode('rol_owner', WorkspaceRole.Owner, null, true),
        roleNode('rol_admin', WorkspaceRole.Admin, null, true),
        roleNode('rol_builder', WorkspaceRole.Builder, null, true),
        roleNode('rol_operator', WorkspaceRole.Operator, null, true),
      ],
    },
  },
  maxUsageCount: Number.POSITIVE_INFINITY,
});

export const buildInviteLinkMock = (url = INVITE_URL): MockLink.MockedResponse => ({
  request: { query: InviteLinkDocument },
  result: { data: { inviteLink: inviteLink(url) } },
});

export const buildNoInviteLinkMock = (): MockLink.MockedResponse => ({
  request: { query: InviteLinkDocument },
  result: { data: { inviteLink: null } },
});

export const buildResetInviteLinkMock = (url = RESET_INVITE_URL): MockLink.MockedResponse => ({
  request: { query: ResetInviteLinkDocument },
  result: { data: { resetInviteLink: inviteLink(url) } },
});

export const buildRemoveMemberMock = (membershipId: string): MockLink.MockedResponse => ({
  request: { query: RemoveMemberDocument, variables: { input: { membershipId } } },
  result: { data: { success: true } },
});

export const buildChangeMemberRoleMock = (
  membershipId: string,
  role: string,
): MockLink.MockedResponse => ({
  request: { query: ChangeMemberRoleDocument, variables: { input: { membershipId, role } } },
  result: {
    data: {
      changeMemberRole: {
        __typename: 'Membership',
        role,
        workspace: { __typename: 'Workspace', id: 'ws_demo' },
      },
    },
  },
});

interface MemberFixture {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly email: string;
  readonly role: string;
  readonly lastActiveAt: string | null;
}

const buildTeamMembersResponse = (members: readonly MemberFixture[]): MockLink.MockedResponse => ({
  request: { query: TeamMembersDocument, variables: { first: MEMBERS_PAGE_SIZE } },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: {
    data: {
      members: {
        __typename: 'MemberConnection',
        totalCount: members.length,
        edges: members.map((member) => ({
          __typename: 'MemberEdge',
          node: { __typename: 'Member', ...member },
        })),
      },
    },
  },
});

export const buildTeamMembersMock = (): MockLink.MockedResponse =>
  buildTeamMembersResponse([
    {
      id: 'mem_1',
      userId: 'usr_1',
      name: 'Pavlo',
      email: 'owner@demo-salon.example',
      role: 'owner',
              roleId: 'rol_owner',
      lastActiveAt: '2026-10-04T09:40:00.000Z',
    },
    {
      id: 'mem_2',
      userId: 'usr_2',
      name: 'Yulia',
      email: 'yulia@demo-salon.example',
      role: 'operator',
              roleId: 'rol_operator',
      lastActiveAt: null,
    },
  ]);

export const buildAdminTeamMembersMock = (): MockLink.MockedResponse =>
  buildTeamMembersResponse([
    {
      id: 'mem_1',
      userId: 'usr_1',
      name: 'Pavlo',
      email: 'owner@demo-salon.example',
      role: 'owner',
      lastActiveAt: '2026-10-04T09:40:00.000Z',
    },
    {
      id: 'mem_2',
      userId: 'usr_2',
      name: 'Yulia',
      email: 'yulia@demo-salon.example',
      role: 'admin',
      lastActiveAt: '2026-10-04T09:41:00.000Z',
    },
    {
      id: 'mem_3',
      userId: 'usr_3',
      name: 'Taras',
      email: 'taras@demo-salon.example',
      role: 'builder',
      lastActiveAt: null,
    },
  ]);
