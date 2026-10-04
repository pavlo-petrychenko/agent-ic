import type { MockLink } from '@apollo/client/testing';
import { ResetInviteLinkDocument } from '@/features/settings/communication/gql/mutation/resetInviteLink.generated';
import { InviteLinkDocument } from '@/features/settings/communication/gql/query/inviteLink.generated';

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
