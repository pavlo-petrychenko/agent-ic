import type { AgentMenuAction } from '@/features/agents/constants/agentMenu.constants';
import type { AgentRow } from '@/features/agents/typedefs/agent.typedefs';

export interface AgentsPageProps {
  workspaceId: string;
}

export interface UseAgentRowMenuResult {
  readonly onAction: (row: AgentRow, action: AgentMenuAction) => void;
}
