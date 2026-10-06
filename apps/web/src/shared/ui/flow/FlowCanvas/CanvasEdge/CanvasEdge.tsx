import { getSmoothStepPath } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';
import { FLOW_CANVAS_EDGE_CORNER_RADIUS } from '@/shared/ui/flow/FlowCanvas/FlowCanvas.constants';
import type { CanvasEdge as CanvasEdgeType } from '@/shared/ui/flow/FlowCanvas/FlowCanvas.typedefs';
import { FlowEdge } from '@/shared/ui/flow/FlowEdge/FlowEdge';

export function CanvasEdge({
  id,
  data,
  selected = false,
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
}: EdgeProps<CanvasEdgeType>) {
  const [path, midX, midY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: FLOW_CANVAS_EDGE_CORNER_RADIUS,
  });

  return (
    <FlowEdge
      edgeId={id}
      path={path}
      midpoint={{ x: midX, y: midY }}
      active={data?.active ?? false}
      inserting={data?.inserting ?? false}
      selected={selected}
      deleteLabel={data?.deleteLabel ?? null}
      onDelete={data?.onDelete ?? null}
    />
  );
}
