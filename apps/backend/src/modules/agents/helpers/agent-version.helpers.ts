import { isDeepStrictEqual } from 'node:util';
import { parseFlow, type FlowDocument } from '@agent-ic/flow';
import {
  AgentVersionKind,
  AgentVersionStatus,
  DRAFT_INITIAL_REVISION,
} from '@/modules/agents/constants/agent.constants';
import { StoredFlowUnreadableError } from '@/modules/agents/errors/stored-flow-unreadable.error';
import type {
  AgentVersion,
  AgentVersionLabels,
  AgentVersionSummaryRow,
  AgentVersionView,
  NewAgentVersion,
  StoredFlow,
  VersionCopy,
} from '@/modules/agents/typedefs/agent-version.typedefs';
import type { AgentVersionSummary } from '@/modules/agents/typedefs/agent.typedefs';

export const copyDraftToVersion = (draft: AgentVersion, copy: VersionCopy): NewAgentVersion => ({
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

const readStoredFlow = ({ id, flow }: StoredFlow): FlowDocument => {
  const parsed = parseFlow(flow);
  if (!parsed.ok) {
    throw new StoredFlowUnreadableError(id, parsed.failure);
  }
  return parsed.flow;
};

export const withCurrentFlow = (version: AgentVersion): AgentVersion => ({
  ...version,
  flow: readStoredFlow(version),
});

export const toAgentVersionSummary = ({
  draft,
  live,
  ...summary
}: AgentVersionSummaryRow): AgentVersionSummary => ({
  ...summary,
  hasUnpublishedChanges:
    draft === null ||
    live === null ||
    !isDeepStrictEqual(readStoredFlow(draft), readStoredFlow(live)),
});
