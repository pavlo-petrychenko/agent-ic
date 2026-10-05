export interface FlowEdgePoint {
  x: number;
  y: number;
}

export interface FlowEdgeProps {
  path: string;
  midpoint?: FlowEdgePoint | null;
  active?: boolean;
  selected?: boolean;
  drawing?: boolean;
  inserting?: boolean;
  onDelete?: (() => void) | null;
  deleteLabel?: string | null;
  edgeId?: string | null;
  className?: string;
}
