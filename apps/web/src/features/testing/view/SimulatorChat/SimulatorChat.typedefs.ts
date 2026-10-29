import type { ChatItem } from '@/features/testing/typedefs/simulator.typedefs';

export interface SimulatorChatProps {
  items: readonly ChatItem[];
  agentName: string;
  typing: boolean;
  selectedRunId: string | null;
  onSelectRun: (runId: string) => void;
  durationLabel: (minutes: number) => string;
}
