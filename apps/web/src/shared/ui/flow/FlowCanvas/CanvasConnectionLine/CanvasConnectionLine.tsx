import { getBezierPath } from '@xyflow/react';
import type { ConnectionLineComponentProps } from '@xyflow/react';
import type { CanvasNode } from '@/shared/ui/flow/FlowCanvas/FlowCanvas.typedefs';
import { FlowEdge } from '@/shared/ui/flow/FlowEdge/FlowEdge';

export function CanvasConnectionLine({
  fromX,
  fromY,
  fromPosition,
  toX,
  toY,
  toPosition,
}: ConnectionLineComponentProps<CanvasNode>) {
  const [path] = getBezierPath({
    sourceX: fromX,
    sourceY: fromY,
    sourcePosition: fromPosition,
    targetX: toX,
    targetY: toY,
    targetPosition: toPosition,
  });

  return <FlowEdge path={path} drawing />;
}
