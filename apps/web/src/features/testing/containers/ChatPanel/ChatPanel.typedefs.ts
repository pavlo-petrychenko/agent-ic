import type { FlowDocument } from '@agent-ic/flow';
import type { ComposerMode } from '@/features/testing/constants/simulator.constants';
import type { SimulatorResult, WriteAs } from '@/features/testing/typedefs/simulator.typedefs';
import type { SimulatorSetupProps } from '@/features/testing/view/SimulatorSetup/SimulatorSetup.typedefs';

export interface ChatPanelProps extends SimulatorSetupProps {
  agentName: string;
  flow: FlowDocument | null;
  simulator: SimulatorResult;
  selectedRunId: string | null;
  onSelectRun: (runId: string) => void;
  onRestart: () => void;
}

export interface ChatFailure {
  mode: ComposerMode;
  message: string;
  retry: () => Promise<void>;
}

export interface PickedWriteAs {
  conversationId: string;
  mode: WriteAs;
}

export interface InactivityFailure {
  conversationId: string;
  message: string;
}
