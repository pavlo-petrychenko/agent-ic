import type { AgentsQuery } from '@/features/agents/communication/gql/query/agents.generated';
import { AGENT_STATUS_FROM_API } from '@/features/agents/constants/agentStatus.constants';
import type { AgentListPage } from '@/features/agents/typedefs/agent.typedefs';

export const toAgentListPage = (data: AgentsQuery): AgentListPage => ({
  agents: data.agents.edges.map(({ node }) => ({
    id: node.id,
    name: node.name,
    description: node.description,
    status: AGENT_STATUS_FROM_API[node.status],
    liveVersionNumber: node.liveVersionNumber,
    draftNumber: node.draftNumber,
    hasUnpublishedChanges: node.hasUnpublishedChanges,
    versionCount: node.versionCount,
  })),
  endCursor: data.agents.pageInfo.endCursor,
  hasNextPage: data.agents.pageInfo.hasNextPage,
});
