import type { TraceDrawing } from '@/features/testing/typedefs/trace.typedefs';

export interface RunTraceProps {
  drawing: TraceDrawing;
  scale: number;
  onSelectNode: (nodeId: string) => void;
}
