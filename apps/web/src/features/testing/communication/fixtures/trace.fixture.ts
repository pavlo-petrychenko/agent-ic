import type { MockLink } from '@apollo/client/testing';
import {
  REPLY_NODE_ID,
  TRIGGER_NODE_ID,
} from '@/features/testing/communication/fixtures/testing.fixture';
import { TestingRunDocument } from '@/features/testing/communication/gql/query/testingRun.generated';
import { RunStepStatus } from '@/shared/api/generated/schema.generated';
import type { RunStatus } from '@/shared/api/generated/schema.generated';

export const TRACE_RUN_ID = 'run_trace';

export const GUARD_OUTPUT = { needs_human: false, reason: null };

export const testingRunMock = (
  status: RunStatus,
  replyStatus: RunStepStatus | null,
): MockLink.MockedResponse => ({
  request: { query: TestingRunDocument, variables: { id: TRACE_RUN_ID } },
  result: {
    data: {
      run: {
        __typename: 'Run',
        id: TRACE_RUN_ID,
        status,
        durationMs: 2100,
        error:
          replyStatus === RunStepStatus.Failed
            ? { __typename: 'RunFailure', nodeId: REPLY_NODE_ID }
            : null,
        totals: { __typename: 'RunTotals', stepsRun: 2, stepsInFlow: 2, messagesSent: 1 },
        steps: [
          {
            id: 'step_1',
            nodeId: TRIGGER_NODE_ID,
            status: RunStepStatus.Succeeded,
            output: GUARD_OUTPUT,
          },
          ...(replyStatus === null
            ? []
            : [
                {
                  id: 'step_2',
                  nodeId: REPLY_NODE_ID,
                  status: replyStatus,
                  output: { messages: ['Hi'] },
                },
              ]),
        ].map((step) => ({ __typename: 'RunStep', ...step })),
      },
    },
  },
});
