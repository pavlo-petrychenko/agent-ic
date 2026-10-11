import type { FlowDocument } from '@agent-ic/flow';
import type { SimulatorRun } from '@/features/testing/typedefs/simulator.typedefs';

export interface TracePanelProps {
  workspaceId: string;
  agentId: string;
  flow: FlowDocument | null;
  run: SimulatorRun | null;
  turnNumber: number | null;
  draft: boolean;
  liveNumber: number | null;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
}
