import { ErrorCode, ErrorReason } from '@agent-ic/contracts';
import type { MockLink } from '@apollo/client/testing';
import { GraphQLError } from 'graphql';
import { RememberWorkspaceDocument } from '@/features/workspace/communication/gql/mutation/rememberWorkspace.generated';

export const buildRememberWorkspaceMock = (
  workspaceId: string,
  onCalled: (workspaceId: string) => void = () => undefined,
): MockLink.MockedResponse => ({
  request: { query: RememberWorkspaceDocument, variables: { workspaceId } },
  result: () => {
    onCalled(workspaceId);
    return {
      data: {
        rememberWorkspace: { __typename: 'User', id: 'usr_1', lastWorkspaceId: workspaceId },
      },
    };
  },
  maxUsageCount: Number.POSITIVE_INFINITY,
});

export const buildRememberWorkspaceErrorMock = (workspaceId: string): MockLink.MockedResponse => ({
  request: { query: RememberWorkspaceDocument, variables: { workspaceId } },
  result: {
    errors: [
      new GraphQLError('remember', {
        extensions: { code: ErrorCode.Forbidden, reason: ErrorReason.WorkspaceAccessDenied },
      }),
    ],
  },
});
