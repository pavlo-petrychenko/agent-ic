import { FLOW_SCHEMA_VERSION } from '@agent-ic/flow';
import type { FlowDocument } from '@agent-ic/flow';
import type {
  FlowSelection,
  FlowViewport,
} from '@/features/flow-builder/typedefs/flowBuilder.typedefs';

export const HISTORY_LIMIT = 50;

export const EMPTY_FLOW: FlowDocument = {
  schemaVersion: FLOW_SCHEMA_VERSION,
  nodes: [],
  edges: [],
};
export const EMPTY_SELECTION: FlowSelection = { nodeIds: [], edgeIds: [] };
export const INITIAL_VIEWPORT: FlowViewport = { x: 0, y: 0, zoom: 1 };
