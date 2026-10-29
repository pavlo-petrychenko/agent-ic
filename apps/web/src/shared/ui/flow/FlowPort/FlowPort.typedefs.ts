import type {
  FlowPortDirection,
  FlowPortState,
  FlowPortStep,
} from '@/shared/ui/flow/FlowPort/FlowPort.constants';
import type { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';

export interface FlowPortKeyboard {
  onStart: () => void;
  onCycle: (step: FlowPortStep) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export interface FlowPortTerminal {
  label: string;
  icon: IconName;
  actionLabel: string;
  actionAriaLabel: string;
  stacked: boolean;
  onAction: () => void;
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
  terminal?: FlowPortTerminal | null;
  className?: string;
}
