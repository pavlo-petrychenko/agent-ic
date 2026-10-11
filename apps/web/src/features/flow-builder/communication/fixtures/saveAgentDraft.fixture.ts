import { ErrorCode, ErrorReason } from '@agent-ic/contracts';
import type { FlowIssue } from '@agent-ic/flow';
import type { MockLink } from '@apollo/client/testing';
import { DEMO_AGENT_ID } from '@/features/flow-builder/communication/fixtures/flowBuilderDraft.fixture';
import { SaveAgentDraftDocument } from '@/features/flow-builder/communication/gql/mutation/saveAgentDraft.generated';

export const CONFLICT_SAVED_BY = 'Oksana';
export const CONFLICT_SAVED_AT = '2026-10-11T09:15:00.000Z';

const saveRequest = (revision: number): MockLink.MockedRequest => ({
  query: SaveAgentDraftDocument,
  variables: (variables) => variables.id === DEMO_AGENT_ID && variables.revision === revision,
});

export const buildSavedDraftResult = (revision: number, issues: readonly FlowIssue[] = []) => ({
  data: {
    saveAgentDraft: {
      __typename: 'AgentDraft',
      revision: revision + 1,
      issues: issues.map((issue) => ({ __typename: 'FlowIssue', ...issue })),
    },
  },
});

export const buildSaveAgentDraftMock = (
  revision: number,
  issues: readonly FlowIssue[] = [],
): MockLink.MockedResponse => ({
  request: saveRequest(revision),
  result: buildSavedDraftResult(revision, issues),
});

export const buildSaveAgentDraftConflictMock = (revision: number): MockLink.MockedResponse => ({
  request: saveRequest(revision),
  result: {
    errors: [
      {
        message: 'The draft changed',
        extensions: {
          code: ErrorCode.Conflict,
          reason: ErrorReason.DraftConflict,
          details: { savedBy: CONFLICT_SAVED_BY, savedAt: CONFLICT_SAVED_AT },
        },
      },
    ],
  },
});

export const buildSaveAgentDraftFailureMock = (revision: number): MockLink.MockedResponse => ({
  request: saveRequest(revision),
  error: new Error('offline'),
});
