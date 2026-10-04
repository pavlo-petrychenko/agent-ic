import type { MockLink } from '@apollo/client/testing';
import { ServerStatusDocument } from '@/features/status/communication/gql/query/serverStatus.generated';

const SERVER_STATUS_TYPENAME = 'ServerStatus';

export const buildServerStatusMock = (
  version: string,
  uptimeSeconds: number,
): MockLink.MockedResponse => ({
  request: { query: ServerStatusDocument },
  result: {
    data: { serverStatus: { __typename: SERVER_STATUS_TYPENAME, version, uptimeSeconds } },
  },
});

export const buildServerStatusFailureMock = (error: Error): MockLink.MockedResponse => ({
  request: { query: ServerStatusDocument },
  error,
});
