import type { MockLink } from '@apollo/client/testing';
import { RenameWorkspaceDocument } from '@/features/settings/communication/gql/mutation/renameWorkspace.generated';

export const buildRenameWorkspaceMock = (): MockLink.MockedResponse => ({
  request: {
    query: RenameWorkspaceDocument,
    variables: {
      input: {
        name: 'Renamed workspace',
      },
    },
  },
  result: {
    data: {
      renameWorkspace: {
        __typename: 'RenameWorkspacePayload',
        workspace: {
          __typename: 'Workspace',
          id: 'ws_demo',
          name: 'Renamed workspace',
        },
      },
    },
  },
});
