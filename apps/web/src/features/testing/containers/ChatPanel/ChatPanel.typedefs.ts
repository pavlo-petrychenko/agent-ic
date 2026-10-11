import type { ComposerMode } from '@/features/testing/constants/simulator.constants';
import type { SimulatorResult } from '@/features/testing/typedefs/simulator.typedefs';
import type { SimulatorSetupProps } from '@/features/testing/view/SimulatorSetup/SimulatorSetup.typedefs';

export interface ChatPanelProps extends SimulatorSetupProps {
  agentName: string;
  simulator: SimulatorResult;
  selectedRunId: string | null;
  onSelectRun: (runId: string) => void;
}

export interface ChatFailure {
  mode: ComposerMode;
  message: string;
  retry: () => Promise<void>;
}
