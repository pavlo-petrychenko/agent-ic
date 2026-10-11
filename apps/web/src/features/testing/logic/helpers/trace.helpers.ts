import { isTriggerNode } from '@agent-ic/flow';
import type { FlowDocument } from '@agent-ic/flow';
import {
  FOCUS_STEP_STATUSES,
  STEP_NODE_STATES,
  TRACE_CELL_SEPARATOR,
  TRACE_GAP,
  TRACE_NODE,
} from '@/features/testing/constants/trace.constants';
import type {
  RunDetails,
  TraceCell,
  TraceDrawing,
  RunStepView,
  TraceEdge,
  TracePoint,
  TracePosition,
  TraceSlot,
} from '@/features/testing/typedefs/trace.typedefs';
import { RunNodeState } from '@/shared/ui/flow/RunNode';

export const layoutTrace = (flow: FlowDocument): TraceSlot[] => {
  const targets = new Map<string, string[]>();
  for (const edge of flow.edges) {
    targets.set(edge.source, [...(targets.get(edge.source) ?? []), edge.target]);
  }
  const cells = new Map<string, { row: number; column: number }>();
  const taken = new Set<string>();
  let bottom = -1;
  const place = (id: string, row: number, column: number): void => {
    if (cells.has(id)) {
      return;
    }
    let free = column;
    while (taken.has(`${row}${TRACE_CELL_SEPARATOR}${free}`)) {
      free += 1;
    }
    cells.set(id, { row, column: free });
    taken.add(`${row}${TRACE_CELL_SEPARATOR}${free}`);
    bottom = Math.max(bottom, row);
    (targets.get(id) ?? []).forEach((target, index) => place(target, row + 1, free + index));
  };
  for (const node of [...flow.nodes.filter(isTriggerNode), ...flow.nodes]) {
    place(node.id, bottom + 1, 0);
  }
  return flow.nodes
    .flatMap((node) => {
      const cell = cells.get(node.id);
      return cell === undefined
        ? []
        : [
            {
              id: node.id,
              label: node.label === '' ? node.key : node.label,
              type: node.type,
              ...cell,
            },
          ];
    })
    .toSorted((a, b) => a.row - b.row || a.column - b.column);
};

export const traceEdges = (
  edges: FlowDocument['edges'],
  slots: readonly TraceSlot[],
): TraceEdge[] => {
  const byId = new Map(slots.map((slot) => [slot.id, slot]));
  return edges.flatMap((edge) => {
    const source = byId.get(edge.source);
    const target = byId.get(edge.target);
    return source === undefined || target === undefined ? [] : [{ id: edge.id, source, target }];
  });
};

const cellOrigin = ({ row, column }: TracePosition): TracePoint => ({
  x: column * (TRACE_NODE.width + TRACE_GAP.x),
  y: row * (TRACE_NODE.height + TRACE_GAP.y),
});

const traceSize = (slots: readonly TracePosition[]): TracePoint => {
  const far = cellOrigin({
    row: Math.max(-1, ...slots.map((slot) => slot.row)),
    column: Math.max(-1, ...slots.map((slot) => slot.column)),
  });
  return { x: Math.max(0, far.x + TRACE_NODE.width), y: Math.max(0, far.y + TRACE_NODE.height) };
};

const edgePath = ({ source, target }: TraceEdge): string => {
  const from = cellOrigin(source);
  const to = cellOrigin(target);
  const x1 = from.x + TRACE_NODE.width / 2;
  const y1 = from.y + TRACE_NODE.height;
  const x2 = to.x + TRACE_NODE.width / 2;
  const y2 = to.y;
  if (x1 === x2 && y2 > y1) {
    return `M${x1} ${y1} V${y2}`;
  }
  const bend = Math.max(TRACE_GAP.y, Math.abs(y2 - y1) / 2);
  return `M${x1} ${y1} C${x1} ${y1 + bend} ${x2} ${y2 - bend} ${x2} ${y2}`;
};

export const drawTrace = (
  cells: readonly TraceCell[],
  edges: readonly TraceEdge[],
): TraceDrawing => ({
  size: traceSize(cells),
  nodes: cells.map((cell) => ({ ...cell, ...cellOrigin(cell) })),
  paths: edges.map((edge) => ({ id: edge.id, d: edgePath(edge) })),
});

export const nodeState = (
  steps: readonly RunStepView[],
  nodeId: string,
  active: boolean,
): RunNodeState => {
  const step = steps.findLast((candidate) => candidate.nodeId === nodeId);
  if (step !== undefined) {
    return STEP_NODE_STATES[step.status];
  }
  return active ? RunNodeState.Waiting : RunNodeState.Skipped;
};

export const focusNodeId = (run: RunDetails | null): string | null =>
  run?.failedNodeId ??
  run?.steps.findLast((step) => FOCUS_STEP_STATUSES.has(step.status))?.nodeId ??
  null;
