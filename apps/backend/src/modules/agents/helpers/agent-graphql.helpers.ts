import { AgentStatus } from '@/modules/agents/constants/agent.constants';
import type { AgentView, AgentsPage } from '@/modules/agents/typedefs/agent.typedefs';
import type { Agent, AgentConnection } from '@/platform/graphql-server/generated/schema.generated';
import { AgentStatus as GraphqlAgentStatus } from '@/platform/graphql-server/generated/schema.generated';

const GRAPHQL_AGENT_STATUS: Readonly<Record<AgentStatus, GraphqlAgentStatus>> = {
  [AgentStatus.Draft]: GraphqlAgentStatus.Draft,
  [AgentStatus.Live]: GraphqlAgentStatus.Live,
  [AgentStatus.Paused]: GraphqlAgentStatus.Paused,
};

export const toGraphqlAgent = (agent: AgentView): Agent => ({
  id: agent.id,
  name: agent.name,
  status: GRAPHQL_AGENT_STATUS[agent.status],
  createdAt: agent.createdAt.toISOString(),
  updatedAt: agent.updatedAt.toISOString(),
});

export const toGraphqlAgentConnection = (page: AgentsPage): AgentConnection => ({
  pageInfo: page.pageInfo,
  edges: page.edges.map((edge) => ({ cursor: edge.cursor, node: toGraphqlAgent(edge.node) })),
});
