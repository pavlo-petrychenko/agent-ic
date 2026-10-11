import type { TraceDrawing } from '@/features/testing/typedefs/trace.typedefs';

export interface RunTraceProps {
  drawing: TraceDrawing;
  onSelectNode: (nodeId: string) => void;
}
