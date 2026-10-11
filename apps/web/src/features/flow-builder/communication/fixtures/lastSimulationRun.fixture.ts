import type { MockLink } from '@apollo/client/testing';
import { DEMO_AGENT_ID } from '@/features/flow-builder/communication/fixtures/flowBuilderDraft.fixture';
import { LastSimulationRunDocument } from '@/features/flow-builder/communication/gql/query/lastSimulationRun.generated';
import type { RunStatus } from '@/shared/api/generated/schema.generated';

export const lastSimulationRunMock = (
  run: { status: RunStatus; finishedAt: string | null; draftRevision: number | null } | null,
): MockLink.MockedResponse => ({
  request: { query: LastSimulationRunDocument, variables: { agentId: DEMO_AGENT_ID } },
  result: {
    data: {
      agent: {
        __typename: 'Agent',
        id: DEMO_AGENT_ID,
        lastSimulationRun:
          run === null ? null : { __typename: 'SimulationRunSummary', id: 'run_last', ...run },
      },
    },
  },
});
