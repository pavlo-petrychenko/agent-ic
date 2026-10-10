import type { AgentVersion, VersionCopy } from '@/modules/agents/typedefs/agent-version.typedefs';

export const copyDraftToVersion = (draft: AgentVersion, copy: VersionCopy): AgentVersion => ({
  id: copy.id,
  workspaceId: draft.workspaceId,
  agentId: draft.agentId,
  kind: copy.kind,
  number: copy.number,
  flow: draft.flow,
  note: draft.note,
  authorId: copy.authorId,
  publishedAt: copy.publishedAt,
  createdAt: copy.at,
  updatedAt: copy.at,
});
