import { Locale, WorkspaceRole } from '@agent-ic/contracts';
import type { MockLink } from '@apollo/client/testing';
import { WorkspaceShellDocument } from '@/features/workspace/communication/gql/query/workspaceShell.generated';

export interface ShellMembershipFixture {
  readonly id: string;
  readonly name: string;
  readonly role: WorkspaceRole;
  readonly memberCount?: number;
}

export const DEMO_WORKSPACE: ShellMembershipFixture = {
  id: 'ws_demo',
  name: 'Demo salon',
  role: WorkspaceRole.Owner,
  memberCount: 5,
};

export const buildWorkspaceShellMock = (
  memberships: readonly ShellMembershipFixture[],
  user: Readonly<{ name: string; email: string; locale: Locale }> = {
    name: 'Pavlo',
    email: 'owner@demo-salon.example',
    locale: Locale.En,
  },
): MockLink.MockedResponse => ({
  request: { query: WorkspaceShellDocument },
  result: {
    data: {
      me: { __typename: 'User', id: 'usr_1', ...user },
      myWorkspaces: memberships.map((membership) => ({
        __typename: 'Membership',
        role: membership.role,
        workspace: {
          __typename: 'Workspace',
          id: membership.id,
          name: membership.name,
          memberCount: membership.memberCount ?? 1,
        },
      })),
    },
  },
  maxUsageCount: Number.POSITIVE_INFINITY,
});
