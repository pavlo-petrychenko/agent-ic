import type { AgentStatus, PauseMode } from '@/modules/agents/constants/agent.constants';
import type { agents } from '@/modules/agents/db/agents.table';
import type { Connection, ConnectionArgs } from '@/platform/graphql-server/typedefs/relay.typedefs';

export interface Agent {
  readonly id: string;
  readonly workspaceId: string;
  readonly name: string;
  readonly description: string | null;
  readonly liveVersionId: string | null;
  readonly draftVersionId: string | null;
  readonly pausedAt: Date | null;
  readonly pauseMode: PauseMode | null;
  readonly awayMessage: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type NewAgent = typeof agents.$inferInsert;

export interface AgentVersionSummary {
  readonly agentId: string;
  readonly liveVersionNumber: number | null;
  readonly lastVersionNumber: number;
  readonly versionCount: number;
  readonly draftBaseVersionNumber: number | null;
  readonly hasUnpublishedChanges: boolean;
}

export interface AgentView {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly status: AgentStatus;
  readonly liveVersionNumber: number | null;
  readonly draftNumber: number;
  readonly draftBaseVersionNumber: number | null;
  readonly hasUnpublishedChanges: boolean;
  readonly versionCount: number;
  readonly pausedAt: Date | null;
  readonly pauseMode: PauseMode | null;
  readonly awayMessage: string | null;
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

export interface PauseAgentInput {
  readonly id: string;
  readonly mode: PauseMode;
  readonly awayMessage?: string | null;
}

export type ListAgentsInput = ConnectionArgs;

export type AgentsPage = Connection<AgentView>;
