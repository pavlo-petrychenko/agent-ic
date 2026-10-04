import type { MockLink } from '@apollo/client/testing';
import { ForgotPasswordDocument } from '@/features/auth/communication/gql/mutation/forgotPassword.generated';
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
