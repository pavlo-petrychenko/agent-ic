import type {
  AgentVersion,
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
  publishedAt: copy.publishedAt,
  createdAt: copy.at,
  updatedAt: copy.at,
});

export const toAgentVersionView = (version: AgentVersion, publicId: string): AgentVersionView => ({
  id: publicId,
  kind: version.kind,
  number: version.number,
  flow: version.flow,
  note: version.note,
  publishedAt: version.publishedAt,
  createdAt: version.createdAt,
});
