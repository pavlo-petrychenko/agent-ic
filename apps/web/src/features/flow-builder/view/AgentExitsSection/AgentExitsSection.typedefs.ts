import type { AgentExitsView } from '@/features/flow-builder/typedefs/agentExit.typedefs';
import type { VariableOption } from '@/shared/ui/inputs/PromptEditor';

export interface AgentExitsSectionProps {
  stepName: string;
  view: AgentExitsView;
  variables: readonly VariableOption[];
}
