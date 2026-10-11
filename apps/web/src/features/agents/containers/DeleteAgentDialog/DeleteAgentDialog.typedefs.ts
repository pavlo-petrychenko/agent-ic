import type { AgentRow } from '@/features/agents/typedefs/agent.typedefs';

export interface DeleteAgentDialogProps {
  agent: AgentRow;
  onClose: () => void;
}
