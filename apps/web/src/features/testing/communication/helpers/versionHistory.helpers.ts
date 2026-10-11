import type { VersionHistoryQuery } from '@/features/testing/communication/gql/query/versionHistory.generated';
import {
  isPublishedVersion,
  toFlow,
  toTestingVersion,
} from '@/features/testing/communication/helpers/version.helpers';
import type { VersionHistory } from '@/features/testing/typedefs/versions.typedefs';

export const toVersionHistory = ({
  agent,
  agentVersions,
  agentDraft,
}: VersionHistoryQuery): VersionHistory => ({
  draft: {
    id: agentDraft.version.id,
    number: agent.draftNumber,
    revision: agentDraft.revision,
    savedAt: agentDraft.savedAt,
    changeCount: agent.draftChangeCount,
    flow: toFlow(agentDraft.version.flow),
  },
  published: agentVersions.filter(isPublishedVersion).map((version) => ({
    ...toTestingVersion(version),
    note: version.note,
    authorName: version.author?.name ?? null,
    publishedAt: version.publishedAt,
  })),
  liveNumber: agent.liveVersionNumber,
});
