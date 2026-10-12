import type { WaitFor } from '@agent-ic/flow';
import type { BranchRow } from '@/features/flow-builder/typedefs/inspector.typedefs';

export interface ParallelInspectorProps {
  branches: readonly BranchRow[];
  waitFor: WaitFor;
  onWaitForChange: (waitFor: WaitFor) => void;
  onBackgroundChange: (edgeId: string, background: boolean) => void;
}
