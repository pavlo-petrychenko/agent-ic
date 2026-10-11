import { AGENT_STATUSES } from '@/features/agents/constants/agentStatus.constants';
import type { AgentStatus } from '@/features/agents/constants/agentStatus.constants';
import type { AgentListItem } from '@/features/agents/typedefs/agent.typedefs';

export const filterAgents = (
  agents: readonly AgentListItem[],
  query: string,
  statuses: readonly AgentStatus[],
): readonly AgentListItem[] => {
  const needle = query.trim().toLocaleLowerCase();
  return agents.filter(
    (agent) =>
      (statuses.length === 0 || statuses.includes(agent.status)) &&
      (needle === '' ||
        agent.name.toLocaleLowerCase().includes(needle) ||
        (agent.description ?? '').toLocaleLowerCase().includes(needle)),
  );
};

export const toStatuses = (ids: readonly string[]): AgentStatus[] =>
  AGENT_STATUSES.filter((status) => ids.includes(status));
