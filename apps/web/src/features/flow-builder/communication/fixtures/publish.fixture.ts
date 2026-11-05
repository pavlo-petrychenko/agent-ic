import { FlowIssueCode } from '@agent-ic/flow';
import type { MockLink } from '@apollo/client/testing';
import { DEMO_AGENT_ID } from '@/features/flow-builder/communication/fixtures/flowBuilderDraft.fixture';
import { PublishAgentDocument } from '@/features/flow-builder/communication/gql/mutation/publishAgent.generated';
import { PublishPreviewDocument } from '@/features/flow-builder/communication/gql/query/publishPreview.generated';
import {
  AgentStatus,
  FlowIssueSeverity,
  SimulatorCheckStatus,
} from '@/shared/api/generated/schema.generated';

export const RELEASE_NOTE = 'Typing indicator';
export const REPLY_NODE_ID = 'reply';

const issue = (code: FlowIssueCode, severity: FlowIssueSeverity) => ({
  __typename: 'FlowIssue',
  code,
  severity,
  nodeId: REPLY_NODE_ID,
  edgeId: null,
  path: [],
  params: {},
});

export const MISSING_PROMPT_ERROR = issue(FlowIssueCode.MissingPrompt, FlowIssueSeverity.Error);
export const NO_ERROR_PATH_WARNING = issue(FlowIssueCode.NoErrorPath, FlowIssueSeverity.Warning);

interface PreviewOptions {
  errors?: readonly unknown[];
  warnings?: readonly unknown[];
  testedAt?: string | null;
  settingsChanges?: readonly unknown[];
}

export const publishPreviewMock = ({
  errors = [],
  warnings = [],
  testedAt = null,
  settingsChanges = [],
}: PreviewOptions = {}): MockLink.MockedResponse => ({
  request: { query: PublishPreviewDocument, variables: { agentId: DEMO_AGENT_ID } },
  result: {
    data: {
      agent: { __typename: 'Agent', id: DEMO_AGENT_ID, draftNumber: 4, liveVersionNumber: 3 },
      publishPreview: {
        __typename: 'PublishPreview',
        diff: {
          __typename: 'FlowDiff',
          addedNodes: [{ id: 'follow', key: 'follow', label: 'Send follow-up' }],
          removedNodes: [],
          changedNodes: [
            {
              __typename: 'FlowNodeChange',
              nodeId: REPLY_NODE_ID,
              key: REPLY_NODE_ID,
              fields: [
                {
                  __typename: 'FlowFieldChange',
                  path: ['config', 'typing'],
                  before: false,
                  after: true,
                },
              ],
            },
          ],
          renamedKeys: [],
          addedEdges: [],
          removedEdges: [],
          changedEdges: [],
          settingsChanges,
          changeCount: 2,
        },
        errors,
        warnings,
        simulator: {
          __typename: 'SimulatorCheck',
          status: testedAt === null ? SimulatorCheckStatus.NotTested : SimulatorCheckStatus.Tested,
          testedAt,
        },
      },
    },
  },
});

const publishRequest = {
  query: PublishAgentDocument,
  variables: { input: { id: DEMO_AGENT_ID, note: RELEASE_NOTE } },
};

export const publishAgentMock: MockLink.MockedResponse = {
  request: publishRequest,
  result: {
    data: {
      publishAgent: {
        __typename: 'PublishAgentPayload',
        agent: {
          __typename: 'Agent',
          id: DEMO_AGENT_ID,
          status: AgentStatus.Live,
          liveVersionNumber: 4,
          draftNumber: 5,
          draftBaseVersionNumber: 4,
          hasUnpublishedChanges: false,
          draftChangeCount: 0,
          versionCount: 4,
        },
        version: { __typename: 'AgentVersion', id: 'ver_4', number: 4 },
      },
    },
  },
};

export const publishAgentFailedMock: MockLink.MockedResponse = {
  request: publishRequest,
  error: new Error('offline'),
};
