import { AgentStatus } from '@/modules/agents/constants/agent.constants';
import type { Agent, AgentView } from '@/modules/agents/typedefs/agent.typedefs';

export const agentStatusOf = (agent: Agent): AgentStatus => {
  if (agent.pausedAt !== null) {
    return AgentStatus.Paused;
  }
  return agent.liveVersionId === null ? AgentStatus.Draft : AgentStatus.Live;
};

export const toAgentView = (agent: Agent, publicId: string): AgentView => ({
  id: publicId,
  name: agent.name,
  status: agentStatusOf(agent),
  createdAt: agent.createdAt,
  updatedAt: agent.updatedAt,
});
