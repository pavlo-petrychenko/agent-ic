import { FLOW_SCHEMA_VERSION, NO_FLOW_SETTINGS } from '@agent-ic/flow';
import type { FlowDocument } from '@agent-ic/flow';
import type {
  FlowPoint,
  FlowSelection,
  FlowViewport,
} from '@/features/flow-builder/typedefs/flowBuilder.typedefs';

export const HISTORY_LIMIT = 50;

export const EMPTY_FLOW: FlowDocument = {
  schemaVersion: FLOW_SCHEMA_VERSION,
  settings: NO_FLOW_SETTINGS,
  nodes: [],
  edges: [],
};
export const EMPTY_SELECTION: FlowSelection = { nodeIds: [], edgeIds: [] };
export const INITIAL_VIEWPORT: FlowViewport = { x: 0, y: 0, zoom: 1 };
export const FIRST_STEP_POSITION: FlowPoint = { x: 0, y: 0 };
