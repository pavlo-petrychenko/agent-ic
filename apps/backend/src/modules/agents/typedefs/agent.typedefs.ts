import type { AgentStatus, PauseMode } from '@/modules/agents/constants/agent.constants';
import type { agents } from '@/modules/agents/db/agents.table';
import type { Connection, ConnectionArgs } from '@/platform/graphql-server/typedefs/relay.typedefs';

export interface Agent {
  readonly id: string;
  readonly workspaceId: string;
  readonly name: string;
  readonly liveVersionId: string | null;
  readonly draftVersionId: string | null;
  readonly pausedAt: Date | null;
  readonly pauseMode: PauseMode | null;
  readonly awayMessage: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type NewAgent = typeof agents.$inferInsert;

export interface AgentView {
  readonly id: string;
  readonly name: string;
  readonly status: AgentStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CreateAgentInput {
  readonly name: string;
}

export interface RenameAgentInput {
  readonly id: string;
  readonly name: string;
}

export interface AgentIdInput {
  readonly id: string;
}

export type ListAgentsInput = ConnectionArgs;

export type AgentsPage = Connection<AgentView>;
