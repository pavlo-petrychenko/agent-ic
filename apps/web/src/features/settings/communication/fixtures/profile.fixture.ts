import type { MockLink } from '@apollo/client/testing';
import { ChangeMyPasswordDocument } from '@/features/settings/communication/gql/mutation/changeMyPassword.generated';
import { LeaveWorkspaceDocument } from '@/features/settings/communication/gql/mutation/leaveWorkspace.generated';
import { RequestMyEmailChangeDocument } from '@/features/settings/communication/gql/mutation/requestMyEmailChange.generated';
import { UpdateMyNameDocument } from '@/features/settings/communication/gql/mutation/updateMyName.generated';

export const buildUpdateMyNameMock = (name: string): MockLink.MockedResponse => ({
  request: { query: UpdateMyNameDocument, variables: { input: { name } } },
  result: { data: { updateMyName: { __typename: 'User', id: 'usr_1', name } } },
});

export const buildRequestMyEmailChangeMock = (email: string): MockLink.MockedResponse => ({
  request: { query: RequestMyEmailChangeDocument, variables: { input: { email } } },
  result: {
    data: { requestMyEmailChange: { __typename: 'RequestEmailChangePayload', accepted: true } },
  },
});

export const buildChangeMyPasswordMock = (
  currentPassword: string,
  newPassword: string,
): MockLink.MockedResponse => ({
  request: {
    query: ChangeMyPasswordDocument,
    variables: { input: { currentPassword, newPassword } },
  },
  result: {
    data: {
      changeMyPassword: {
        __typename: 'User',
        id: 'usr_1',
        email: 'owner@demo-salon.example',
        name: 'Pavlo',
        locale: 'en',
      },
    },
  },
});

export const buildLeaveWorkspaceMock = (workspaceId: string): MockLink.MockedResponse => ({
  request: { query: LeaveWorkspaceDocument, variables: { workspaceId } },
  result: { data: { success: true } },
});
