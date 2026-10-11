import type { AgentDetails } from '@/features/flow-builder/typedefs/flowBuilder.typedefs';

export interface AgentDetailsPopoverProps {
  details: AgentDetails;
  open: boolean;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (details: AgentDetails) => void;
}
