import type {
  FlowPortDirection,
  FlowPortState,
  FlowPortStep,
} from '@/shared/ui/flow/FlowPort/FlowPort.constants';

export interface FlowPortKeyboard {
  onStart: () => void;
  onCycle: (step: FlowPortStep) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export interface FlowPortProps {
  direction: FlowPortDirection;
  state?: FlowPortState;
  connected?: boolean;
  ariaLabel?: string | null;
  label?: string | null;
  labelActive?: boolean;
  onLabelClick?: (() => void) | null;
  keyboard?: FlowPortKeyboard | null;
  className?: string;
}
