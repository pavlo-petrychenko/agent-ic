import {
  AgentVersionKind,
  AgentVersionStatus,
  DRAFT_INITIAL_REVISION,
} from '@/modules/agents/constants/agent.constants';
import type {
  AgentVersion,
  AgentVersionLabels,
  AgentVersionView,
  VersionCopy,
} from '@/modules/agents/typedefs/agent-version.typedefs';

export const copyDraftToVersion = (draft: AgentVersion, copy: VersionCopy): AgentVersion => ({
  id: copy.id,
  workspaceId: draft.workspaceId,
  agentId: draft.agentId,
  kind: copy.kind,
  number: copy.number,
  flow: draft.flow,
  note: draft.note,
  authorId: copy.authorId,
  baseVersionId: draft.baseVersionId,
  revision: DRAFT_INITIAL_REVISION,
  publishedAt: copy.publishedAt,
  createdAt: copy.at,
  updatedAt: copy.at,
});

export const agentVersionStatusOf = (
  version: AgentVersion,
  liveVersionId: string | null,
): AgentVersionStatus => {
  if (version.kind === AgentVersionKind.Draft) {
    return AgentVersionStatus.Draft;
  }
  return version.id === liveVersionId ? AgentVersionStatus.Live : AgentVersionStatus.Archived;
};

export const authorIdsOf = (versions: readonly AgentVersion[]): string[] => [
  ...new Set(versions.flatMap((version) => (version.authorId === null ? [] : [version.authorId]))),
];

export const toAgentVersionView = (
  version: AgentVersion,
  labels: AgentVersionLabels,
): AgentVersionView => ({
  id: labels.id,
  kind: version.kind,
  status: labels.status,
  number: version.number,
  flow: version.flow,
  note: version.note,
  author: labels.author,
  publishedAt: version.publishedAt,
  createdAt: version.createdAt,
});
