import { ErrorCode, ErrorReason } from '@agent-ic/contracts';
import type { MockLink } from '@apollo/client/testing';
import { DEMO_AGENT_ID } from '@/features/flow-builder/communication/fixtures/flowBuilderDraft.fixture';
import { BuilderRestoreVersionDocument } from '@/features/flow-builder/communication/gql/mutation/builderRestoreVersion.generated';
import { RollbackAgentDocument } from '@/features/flow-builder/communication/gql/mutation/rollbackAgent.generated';
import type { BuilderVersion } from '@/features/flow-builder/typedefs/versions.typedefs';
import { AgentStatus } from '@/shared/api/generated/schema.generated';

export const OLD_VERSION: BuilderVersion = {
  id: 'ver_1',
  number: 1,
  live: false,
  note: 'First release',
  authorName: 'Olena',
  publishedAt: '2026-10-01T09:00:00.000Z',
};

export const LIVE_VERSION: BuilderVersion = {
  id: 'ver_2',
  number: 2,
  live: true,
  note: null,
  authorName: 'Olena',
  publishedAt: '2026-10-05T09:00:00.000Z',
};

export const ROLLBACK_NOTE = 'Rolled back to version 1';
export const ROLLBACK_REVISION = 4;
export const ROLLED_BACK_NUMBER = 3;

const rollbackRequest = (note: string) => ({
  query: RollbackAgentDocument,
  variables: { input: { versionId: OLD_VERSION.id, revision: ROLLBACK_REVISION, note } },
});

export const rollbackAgentMock = (note: string = ROLLBACK_NOTE): MockLink.MockedResponse => ({
  request: rollbackRequest(note),
  result: {
    data: {
      rollbackAgent: {
        __typename: 'RollbackAgentPayload',
        agent: {
          __typename: 'Agent',
          id: DEMO_AGENT_ID,
          status: AgentStatus.Live,
          liveVersionNumber: ROLLED_BACK_NUMBER,
          draftNumber: ROLLED_BACK_NUMBER + 1,
          draftBaseVersionNumber: ROLLED_BACK_NUMBER,
          hasUnpublishedChanges: false,
          draftChangeCount: 0,
          versionCount: ROLLED_BACK_NUMBER,
        },
        version: { __typename: 'AgentVersion', id: 'ver_3', number: ROLLED_BACK_NUMBER },
        draft: { __typename: 'AgentDraft', revision: ROLLBACK_REVISION + 1 },
      },
    },
  },
});

export const rollbackBlockedMock: MockLink.MockedResponse = {
  request: rollbackRequest(ROLLBACK_NOTE),
  result: {
    errors: [
      {
        message: 'The flow has blocking issues and cannot be published.',
        extensions: {
          code: ErrorCode.PreconditionFailed,
          reason: ErrorReason.AgentFlowHasBlockingIssues,
        },
      },
    ],
  },
};

export const restoreVersionMock: MockLink.MockedResponse = {
  request: {
    query: BuilderRestoreVersionDocument,
    variables: { input: { versionId: OLD_VERSION.id, revision: ROLLBACK_REVISION } },
  },
  result: {
    data: {
      restoreAgentVersion: {
        __typename: 'AgentDraft',
        revision: ROLLBACK_REVISION + 1,
        version: { __typename: 'AgentVersion', id: 'ver_draft' },
      },
    },
  },
};
