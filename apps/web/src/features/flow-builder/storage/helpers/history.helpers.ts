import type { FlowDocument } from '@agent-ic/flow';
import { HISTORY_LIMIT } from '@/features/flow-builder/constants/flowBuilder.constants';
import type {
  FlowHistory,
  FlowSelection,
} from '@/features/flow-builder/typedefs/flowBuilder.typedefs';

export interface HistoryStep {
  document: FlowDocument;
  history: FlowHistory;
}

export const recordEdit = (
  history: FlowHistory,
  current: FlowDocument,
  next: FlowDocument,
): HistoryStep => ({
  document: next,
  history: { past: [...history.past, current].slice(-HISTORY_LIMIT), future: [] },
});

export const stepBack = (history: FlowHistory, current: FlowDocument): HistoryStep | null => {
  const previous = history.past.at(-1);
  return previous === undefined
    ? null
    : {
        document: previous,
        history: { past: history.past.slice(0, -1), future: [current, ...history.future] },
      };
};

export const stepForward = (history: FlowHistory, current: FlowDocument): HistoryStep | null => {
  const [next, ...future] = history.future;
  return next === undefined
    ? null
    : { document: next, history: { past: [...history.past, current], future } };
};

export const keepExisting = (selection: FlowSelection, document: FlowDocument): FlowSelection => {
  const nodeIds = new Set(document.nodes.map((node) => node.id));
  const edgeIds = new Set(document.edges.map((edge) => edge.id));
  return {
    nodeIds: selection.nodeIds.filter((id) => nodeIds.has(id)),
    edgeIds: selection.edgeIds.filter((id) => edgeIds.has(id)),
  };
};
