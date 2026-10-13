import { Locale, WorkspaceRole } from '@agent-ic/contracts';
import type { MockLink } from '@apollo/client/testing';
import { WorkspaceShellDocument } from '@/features/workspace/communication/gql/query/workspaceShell.generated';

export interface ShellMembershipFixture {
  readonly id: string;
  readonly name: string;
  readonly timeZone?: string;
  readonly role: WorkspaceRole;
  readonly memberCount?: number;
}

export const DEMO_TIME_ZONE = 'Europe/Kyiv';

export const DEMO_WORKSPACE: ShellMembershipFixture = {
  id: 'ws_demo',
  name: 'Demo salon',
  timeZone: DEMO_TIME_ZONE,
  role: WorkspaceRole.Owner,
  memberCount: 5,
};

export interface ShellUserFixture {
  readonly id?: string;
  readonly name: string;
  readonly email: string;
  readonly locale: Locale;
}

export const buildWorkspaceShellMock = (
  memberships: readonly ShellMembershipFixture[],
  user: Readonly<ShellUserFixture> = {
    name: 'Pavlo',
    email: 'owner@demo-salon.example',
    locale: Locale.En,
  },
): MockLink.MockedResponse => {
  const { id = 'usr_1', ...rest } = user;
  return {
    request: { query: WorkspaceShellDocument },
    result: {
      data: {
        me: { __typename: 'User', id, ...rest },
        myWorkspaces: memberships.map((membership) => ({
          __typename: 'Membership',
          role: membership.role,
          workspace: {
            __typename: 'Workspace',
            id: membership.id,
            name: membership.name,
            timeZone: membership.timeZone ?? DEMO_TIME_ZONE,
            memberCount: membership.memberCount ?? 1,
          },
        })),
      },
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
  };
};
