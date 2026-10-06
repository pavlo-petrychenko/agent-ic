import { NodeKind } from '@/shared/ui/display/NodeTile/NodeTile.constants';

export enum TraceStepKind {
  Agent = 'agent',
  Model = 'model',
  Tool = 'tool',
  Completion = 'completion',
  Knowledge = 'knowledge',
}

export enum TraceRowKey {
  Select = 'Enter',
  SelectSpace = ' ',
  Expand = 'ArrowRight',
  Collapse = 'ArrowLeft',
  Next = 'ArrowDown',
  Previous = 'ArrowUp',
  First = 'Home',
  Last = 'End',
}

export enum TraceRowFocusTarget {
  First = 'first',
  Last = 'last',
  Next = 'next',
  Previous = 'previous',
}

export const TRACE_STEP_NODE_KINDS: Readonly<Record<TraceStepKind, NodeKind>> = {
  [TraceStepKind.Agent]: NodeKind.Agent,
  [TraceStepKind.Model]: NodeKind.Gen,
  [TraceStepKind.Tool]: NodeKind.Tool,
  [TraceStepKind.Completion]: NodeKind.Compl,
  [TraceStepKind.Knowledge]: NodeKind.Kb,
};

export const TRACE_ROW_CHEVRON_SIZE = 11;
export const TRACE_ROW_SPINNER_SIZE = 12;
export const TRACE_TREE_SELECTOR = '[role="tree"]';
export const TRACE_ITEM_SELECTOR = '[role="treeitem"]';
export const TRACE_ROW_LEVEL_OFFSET = 1;
