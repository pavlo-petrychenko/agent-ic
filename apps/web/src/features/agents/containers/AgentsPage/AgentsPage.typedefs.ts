import type { AgentTemplateKey } from '@agent-ic/flow';
import type { AgentMenuAction } from '@/features/agents/constants/agentMenu.constants';
import type { AgentRow } from '@/features/agents/typedefs/agent.typedefs';

export interface AgentsPageProps {
  workspaceId: string;
  templatesOpen: boolean;
  templateKey: AgentTemplateKey | null;
}

export interface UseAgentRowMenuResult {
  readonly onAction: (row: AgentRow, action: AgentMenuAction) => void;
  readonly pauseRow: AgentRow | null;
  readonly deleteRow: AgentRow | null;
  readonly closePause: () => void;
  readonly closeDelete: () => void;
}
