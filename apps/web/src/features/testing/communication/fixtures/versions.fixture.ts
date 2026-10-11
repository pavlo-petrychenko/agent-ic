import type { MockLink } from '@apollo/client/testing';
import {
  LIVE_VERSION_ID,
  REPLY_NODE_ID,
  TEST_AGENT_ID,
  TRACE_FLOW,
} from '@/features/testing/communication/fixtures/testing.fixture';
import { RestoreVersionDocument } from '@/features/testing/communication/gql/mutation/restoreVersion.generated';
import { VersionDiffDocument } from '@/features/testing/communication/gql/query/versionDiff.generated';
import { VersionHistoryDocument } from '@/features/testing/communication/gql/query/versionHistory.generated';
import { AgentVersionStatus } from '@/shared/api/generated/schema.generated';

export const DRAFT_VERSION_ID = 'ver_4';
export const ARCHIVED_VERSION_ID = 'ver_2';
export const AUTHOR_NAME = 'Pavlo';
export const LIVE_NOTE = 'Added a conversation guard\nReplies come as short messages';
export const MINUTE_MS = 60_000;
export const GUARD_STEP_LABEL = 'Conversation guard';

const version = (
  id: string,
  number: number,
  status: AgentVersionStatus,
  note: string | null,
  publishedAt: string,
) => ({
  __typename: 'AgentVersion',
  id,
  number,
  status,
  note,
  publishedAt,
  flow: TRACE_FLOW,
  author: { __typename: 'AgentVersionAuthor', name: AUTHOR_NAME },
});

export const PUBLISHED_VERSIONS = [
  version(LIVE_VERSION_ID, 3, AgentVersionStatus.Live, LIVE_NOTE, '2026-09-26T10:00:00.000Z'),
  version(ARCHIVED_VERSION_ID, 2, AgentVersionStatus.Archived, null, '2026-09-18T10:00:00.000Z'),
];

export const versionHistoryMock = ({
  published = PUBLISHED_VERSIONS,
  changeCount = 3,
  draftAuthor = AUTHOR_NAME,
}: {
  published?: typeof PUBLISHED_VERSIONS;
  changeCount?: number | null;
  draftAuthor?: string | null;
} = {}): MockLink.MockedResponse => ({
  request: { query: VersionHistoryDocument, variables: { agentId: TEST_AGENT_ID } },
  result: {
    data: {
      agent: {
        __typename: 'Agent',
        id: TEST_AGENT_ID,
        draftNumber: 4,
        liveVersionNumber: published.length === 0 ? null : 3,
        draftChangeCount: changeCount,
      },
      agentVersions: published,
      agentDraft: {
        __typename: 'AgentDraft',
        revision: 7,
        savedAt: new Date(Date.now() - 5 * MINUTE_MS).toISOString(),
        version: {
          __typename: 'AgentVersion',
          id: DRAFT_VERSION_ID,
          flow: TRACE_FLOW,
          author:
            draftAuthor === null ? null : { __typename: 'AgentVersionAuthor', name: draftAuthor },
        },
      },
    },
  },
});

export const failedVersionHistoryMock: MockLink.MockedResponse = {
  request: { query: VersionHistoryDocument, variables: { agentId: TEST_AGENT_ID } },
  error: new Error('offline'),
};

export const versionDiffMock = (
  fromId: string,
  toId: string,
  addedLabel = GUARD_STEP_LABEL,
): MockLink.MockedResponse => ({
  request: { query: VersionDiffDocument, variables: { agentId: TEST_AGENT_ID, fromId, toId } },
  result: {
    data: {
      agentVersionDiff: {
        __typename: 'FlowDiff',
        addedNodes: [{ id: 'node_guard', key: 'guard', label: addedLabel }],
        removedNodes: [],
        changedNodes: [
          {
            __typename: 'FlowNodeChange',
            nodeId: REPLY_NODE_ID,
            key: 'reply',
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
        changeCount: 2,
      },
    },
  },
});

export const restoreVersionMock = (
  result: MockLink.MockedResponse['result'],
): MockLink.MockedResponse => ({
  request: {
    query: RestoreVersionDocument,
    variables: { input: { versionId: ARCHIVED_VERSION_ID, revision: 7 } },
  },
  result,
});

export const RESTORED_DRAFT = {
  data: {
    restoreAgentVersion: {
      __typename: 'AgentDraft',
      revision: 8,
      version: { __typename: 'AgentVersion', id: DRAFT_VERSION_ID },
    },
  },
};

export const failedRestoreVersionMock: MockLink.MockedResponse = {
  request: {
    query: RestoreVersionDocument,
    variables: { input: { versionId: ARCHIVED_VERSION_ID, revision: 7 } },
  },
  error: new Error('offline'),
};

export const failedVersionDiffMock = (fromId: string, toId: string): MockLink.MockedResponse => ({
  request: { query: VersionDiffDocument, variables: { agentId: TEST_AGENT_ID, fromId, toId } },
  error: new Error('offline'),
});
