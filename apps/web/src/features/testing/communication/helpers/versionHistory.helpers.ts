import type { VersionHistoryQuery } from '@/features/testing/communication/gql/query/versionHistory.generated';
import { toFlow } from '@/features/testing/communication/helpers/version.helpers';
import type { VersionHistory } from '@/features/testing/typedefs/versions.typedefs';
import { AgentVersionStatus } from '@/shared/api/generated/schema.generated';

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
  published: agentVersions.flatMap((version) =>
    version.number === null || version.status === AgentVersionStatus.Draft
      ? []
      : [
          {
            id: version.id,
            number: version.number,
            live: version.status === AgentVersionStatus.Live,
            note: version.note,
            authorName: version.author?.name ?? null,
            publishedAt: version.publishedAt,
            flow: toFlow(version.flow),
          },
        ],
  ),
  liveNumber: agent.liveVersionNumber,
});
