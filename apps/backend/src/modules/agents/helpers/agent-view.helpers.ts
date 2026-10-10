import { AgentStatus } from '@/modules/agents/constants/agent.constants';
import type {
  Agent,
  AgentVersionSummary,
  AgentView,
} from '@/modules/agents/typedefs/agent.typedefs';

export const agentStatusOf = (agent: Agent): AgentStatus => {
  if (agent.pausedAt !== null) {
    return AgentStatus.Paused;
  }
  return agent.liveVersionId === null ? AgentStatus.Draft : AgentStatus.Live;
};

export const toAgentView = (
  agent: Agent,
  publicId: string,
  summary: AgentVersionSummary,
): AgentView => ({
  id: publicId,
  name: agent.name,
  description: agent.description,
  status: agentStatusOf(agent),
  liveVersionNumber: summary.liveVersionNumber,
  draftNumber: summary.lastVersionNumber + 1,
  draftBaseVersionNumber: summary.draftBaseVersionNumber,
  hasUnpublishedChanges: summary.hasUnpublishedChanges,
  draftChangeCount: null,
  versionCount: summary.versionCount,
  pausedAt: agent.pausedAt,
  pauseMode: agent.pauseMode,
  awayMessage: agent.awayMessage,
  createdAt: agent.createdAt,
  updatedAt: agent.updatedAt,
});
