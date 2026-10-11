import type { AgentRow } from '@/features/agents/typedefs/agent.typedefs';

export interface PauseAgentDialogProps {
  agent: AgentRow;
  onClose: () => void;
}
