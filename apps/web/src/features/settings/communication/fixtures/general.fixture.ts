import type { MockLink } from '@apollo/client/testing';
import { RenameWorkspaceDocument } from '@/features/settings/communication/gql/mutation/renameWorkspace.generated';
import { UpdateTimeZoneDocument } from '@/features/settings/communication/gql/mutation/updateTimeZone.generated';

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

export const buildUpdateTimeZoneMock = (): MockLink.MockedResponse => ({
  request: {
    query: UpdateTimeZoneDocument,
    variables: {
      input: {
        timeZone: 'Europe/London',
      },
    },
  },
  result: {
    data: {
      updateTimeZone: {
        __typename: 'Membership',
        workspace: {
          __typename: 'Workspace',
          id: 'ws_demo',
          timeZone: 'Europe/London',
        },
      },
    },
  },
});
