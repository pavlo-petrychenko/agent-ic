import type {
  Agent,
  AgentConnection,
  AgentEdge,
  PublishAgentPayload,
} from '@/platform/graphql-server/generated/schema.generated';
import type { GraphqlParent } from '@/platform/graphql-server/typedefs/graphql-loader.typedefs';

export type AgentParent = GraphqlParent<Agent, 'draftChangeCount' | 'lastSimulationRun'>;

export interface AgentEdgeParent extends Omit<AgentEdge, 'node'> {
  readonly node: AgentParent;
}

export interface AgentConnectionParent extends Omit<AgentConnection, 'edges'> {
  readonly edges: readonly AgentEdgeParent[];
}

export interface PublishAgentPayloadParent extends Omit<PublishAgentPayload, 'agent'> {
  readonly agent: AgentParent;
}
