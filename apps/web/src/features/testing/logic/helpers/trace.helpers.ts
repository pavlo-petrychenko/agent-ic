import { isTriggerNode } from '@agent-ic/flow';
import type { FlowDocument } from '@agent-ic/flow';
import {
  FOCUS_STEP_STATUSES,
  STEP_NODE_STATES,
  TRACE_CELL_SEPARATOR,
} from '@/features/testing/constants/trace.constants';
import type {
  RunDetails,
  RunStepView,
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
  const linked = new Set(
    flow.edges.flatMap((edge) => {
      const source = cells.get(edge.source);
      const target = cells.get(edge.target);
      return source !== undefined &&
        target !== undefined &&
        target.row === source.row + 1 &&
        target.column === source.column
        ? [edge.target]
        : [];
    }),
  );
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
              linked: linked.has(node.id),
            },
          ];
    })
    .toSorted((a, b) => a.row - b.row || a.column - b.column);
};

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
