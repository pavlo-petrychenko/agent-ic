import type { MockLink } from '@apollo/client/testing';
import { DEMO_AGENT_ID } from '@/features/flow-builder/communication/fixtures/flowBuilderDraft.fixture';
import { TestApiRequestDocument } from '@/features/flow-builder/communication/gql/mutation/testApiRequest.generated';
import { ApiRequestTestOutcome } from '@/shared/api/generated/schema.generated';

export const TEST_RESPONSE_BODY = '{"id":42}';

export const testApiRequestMock = (nodeId: string): MockLink.MockedResponse => ({
  request: {
    query: TestApiRequestDocument,
    variables: { input: { agentId: DEMO_AGENT_ID, nodeId, variables: null } },
  },
  result: {
    data: {
      testApiRequest: {
        outcome: ApiRequestTestOutcome.Responded,
        status: 200,
        body: TEST_RESPONSE_BODY,
        bodyTruncated: false,
        durationMs: 120,
      },
    },
  },
});
