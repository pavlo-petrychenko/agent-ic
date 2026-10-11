import { describe, expect, it } from 'vitest';
import type { VersionHistoryQuery } from '@/features/testing/communication/gql/query/versionHistory.generated';
import { toVersionHistory } from '@/features/testing/communication/helpers/versionHistory.helpers';
import { AgentVersionStatus } from '@/shared/api/generated/schema.generated';

const PUBLISHED_AT = '2026-09-26T10:00:00.000Z';

const row = (id: string, number: number | null, status: AgentVersionStatus) => ({
  id,
  number,
  status,
  note: null,
  publishedAt: PUBLISHED_AT,
  flow: null,
  author: null,
});

const QUERY: VersionHistoryQuery = {
  agent: { id: 'agt_1', draftNumber: 4, liveVersionNumber: 3, draftChangeCount: 2 },
  agentVersions: [
    row('ver_4', 4, AgentVersionStatus.Draft),
    row('ver_3', 3, AgentVersionStatus.Live),
    row('ver_x', null, AgentVersionStatus.Archived),
  ],
  agentDraft: {
    revision: 7,
    savedAt: PUBLISHED_AT,
    version: { id: 'ver_4', flow: null, author: { name: 'Pavlo' } },
  },
};

describe('toVersionHistory', () => {
  it('keeps only numbered published versions and marks the live one', () => {
    expect(toVersionHistory(QUERY).published).toEqual([
      {
        id: 'ver_3',
        number: 3,
        live: true,
        note: null,
        authorName: null,
        publishedAt: PUBLISHED_AT,
        flow: null,
      },
    ]);
  });

  it('describes the draft with its revision, last editor and unpublished change count', () => {
    expect(toVersionHistory(QUERY).draft).toEqual({
      id: 'ver_4',
      number: 4,
      revision: 7,
      savedAt: PUBLISHED_AT,
      changeCount: 2,
      authorName: 'Pavlo',
      flow: null,
    });
  });
});
