import type { MockLink } from '@apollo/client/testing';
import {
  LIVE_VERSION_ID,
  TEST_AGENT_ID,
  TRACE_FLOW,
} from '@/features/testing/communication/fixtures/testing.fixture';
import { VersionHistoryDocument } from '@/features/testing/communication/gql/query/versionHistory.generated';
import { AgentVersionStatus } from '@/shared/api/generated/schema.generated';

export const DRAFT_VERSION_ID = 'ver_4';
export const ARCHIVED_VERSION_ID = 'ver_2';
export const AUTHOR_NAME = 'Pavlo';
export const LIVE_NOTE = 'Added a conversation guard\nReplies come as short messages';
export const MINUTE_MS = 60_000;

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
}: {
  published?: typeof PUBLISHED_VERSIONS;
  changeCount?: number | null;
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
        version: { __typename: 'AgentVersion', id: DRAFT_VERSION_ID, flow: TRACE_FLOW },
      },
    },
  },
});

export const failedVersionHistoryMock: MockLink.MockedResponse = {
  request: { query: VersionHistoryDocument, variables: { agentId: TEST_AGENT_ID } },
  error: new Error('offline'),
};
