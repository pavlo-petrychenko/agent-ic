import type { MockLink } from '@apollo/client/testing';
import { ResetInviteLinkDocument } from '@/features/settings/communication/gql/mutation/resetInviteLink.generated';
import { InviteLinkDocument } from '@/features/settings/communication/gql/query/inviteLink.generated';
import { TeamMembersDocument } from '@/features/settings/communication/gql/query/teamMembers.generated';
import { MEMBERS_PAGE_SIZE } from '@/features/settings/constants/member.constants';

export const INVITE_URL = 'https://app.example/invite/first-token';
export const RESET_INVITE_URL = 'https://app.example/invite/second-token';

const inviteLink = (url: string) => ({
  __typename: 'InviteLink',
  url,
  role: 'operator',
  expiresAt: '2026-10-16T12:00:00.000Z',
  joinedCount: 1,
});

export const buildInviteLinkMock = (url = INVITE_URL): MockLink.MockedResponse => ({
  request: { query: InviteLinkDocument },
  result: { data: { inviteLink: inviteLink(url) } },
});

export const buildResetInviteLinkMock = (url = RESET_INVITE_URL): MockLink.MockedResponse => ({
  request: { query: ResetInviteLinkDocument },
  result: { data: { resetInviteLink: inviteLink(url) } },
});

export const buildTeamMembersMock = (): MockLink.MockedResponse => ({
  request: { query: TeamMembersDocument, variables: { first: MEMBERS_PAGE_SIZE } },
  result: {
    data: {
      members: {
        __typename: 'MemberConnection',
        totalCount: 2,
        edges: [
          {
            __typename: 'MemberEdge',
            node: {
              __typename: 'Member',
              id: 'mem_1',
              name: 'Pavlo',
              email: 'owner@demo-salon.example',
              role: 'owner',
              lastActiveAt: '2026-10-04T09:40:00.000Z',
            },
          },
          {
            __typename: 'MemberEdge',
            node: {
              __typename: 'Member',
              id: 'mem_2',
              name: 'Yulia',
              email: 'yulia@demo-salon.example',
              role: 'operator',
              lastActiveAt: null,
            },
          },
        ],
      },
    },
  },
});
