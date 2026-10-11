import type { AgentStatus } from '@/features/agents/constants/agentStatus.constants';

export interface AgentListItem {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly status: AgentStatus;
  readonly liveVersionNumber: number | null;
  readonly draftNumber: number;
  readonly hasUnpublishedChanges: boolean;
}

export interface AgentRow {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly status: AgentStatus;
  readonly statusLabel: string;
  readonly note: string | null;
}

export interface AgentListPage {
  readonly agents: readonly AgentListItem[];
  readonly endCursor: string | null;
  readonly hasNextPage: boolean;
}

export interface UseCreateAgentResult {
  readonly createAgent: (name: string) => Promise<string | null>;
  readonly creating: boolean;
}
