import { ErrorCode } from '@agent-ic/contracts';
import type { ErrorReason } from '@agent-ic/contracts';
import type { MockLink } from '@apollo/client/testing';
import { GraphQLError } from 'graphql';
import { AcceptInviteDocument } from '@/features/auth/communication/gql/mutation/acceptInvite.generated';
import { CreateWorkspaceDocument } from '@/features/auth/communication/gql/mutation/createWorkspace.generated';
import { ForgotPasswordDocument } from '@/features/auth/communication/gql/mutation/forgotPassword.generated';
import { ResendConfirmationDocument } from '@/features/auth/communication/gql/mutation/resendConfirmation.generated';
import { CurrentUserEmailDocument } from '@/features/auth/communication/gql/query/currentUserEmail.generated';
import { InviteInfoDocument } from '@/features/auth/communication/gql/query/inviteInfo.generated';
import { MyWorkspacesDocument } from '@/features/auth/communication/gql/query/myWorkspaces.generated';
import type { SessionTokens } from '@/shared/api/typedefs/session.typedefs';

export const buildSessionTokens = (accessToken = 'access-token'): SessionTokens => ({
  accessToken,
  accessTokenExpiresAt: '2030-01-01T00:00:00.000Z',
});

export const buildMyWorkspacesMock = (
  workspaceIds: readonly string[],
): MockLink.MockedResponse => ({
  request: { query: MyWorkspacesDocument },
  result: {
    data: {
      myWorkspaces: workspaceIds.map((id) => ({
        __typename: 'Membership',
        workspace: { __typename: 'Workspace', id },
      })),
    },
  },
});

export const buildForgotPasswordMock = (email: string): MockLink.MockedResponse => ({
  request: { query: ForgotPasswordDocument, variables: { input: { email } } },
  result: { data: { forgotPassword: { __typename: 'ForgotPasswordPayload', accepted: true } } },
});

export const buildResendConfirmationMock = (
  input: Readonly<{ email: string | null; token: string | null }>,
): MockLink.MockedResponse => ({
  request: { query: ResendConfirmationDocument, variables: { input } },
  result: {
    data: { resendConfirmation: { __typename: 'ResendConfirmationPayload', accepted: true } },
  },
});

export const buildCurrentUserEmailMock = (email: string): MockLink.MockedResponse => ({
  request: { query: CurrentUserEmailDocument },
  result: { data: { me: { __typename: 'User', id: 'usr_1', email } } },
});

export const buildCreateWorkspaceMock = (
  input: Readonly<{ name: string; timeZone: string }>,
  workspaceId: string,
): MockLink.MockedResponse => ({
  request: { query: CreateWorkspaceDocument, variables: { input } },
  result: {
    data: {
      createWorkspace: {
        __typename: 'Membership',
        role: 'owner',
        workspace: { __typename: 'Workspace', id: workspaceId, name: input.name },
      },
    },
  },
});

export const buildInviteInfoMock = (
  token: string,
  workspaceName = 'Demo salon',
): MockLink.MockedResponse => ({
  request: { query: InviteInfoDocument, variables: { token } },
  result: {
    data: {
      inviteInfo: {
        __typename: 'InviteInfo',
        workspaceName,
        inviterName: 'Pavlo',
        memberCount: 5,
        role: 'operator',
      },
    },
  },
});

export const buildInviteInfoErrorMock = (
  token: string,
  reason: ErrorReason,
): MockLink.MockedResponse => ({
  request: { query: InviteInfoDocument, variables: { token } },
  result: {
    errors: [new GraphQLError('invite', { extensions: { code: ErrorCode.NotFound, reason } })],
  },
});

export const buildAcceptInviteMock = (
  token: string,
  workspaceId: string,
): MockLink.MockedResponse => ({
  request: { query: AcceptInviteDocument, variables: { token } },
  result: {
    data: {
      acceptInvite: {
        __typename: 'Membership',
        role: 'operator',
        workspace: { __typename: 'Workspace', id: workspaceId },
      },
    },
  },
});
