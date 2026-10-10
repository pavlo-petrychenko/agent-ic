export const FLOW_CANVAS_NODE_TYPE = 'flowCanvasNode';
export const FLOW_CANVAS_EDGE_TYPE = 'flowCanvasEdge';
export const FLOW_CANVAS_IN_PORT_ID = 'in';
export const FLOW_CANVAS_GRID_GAP = 20;
export const FLOW_CANVAS_GRID_DOT_SIZE = 1;
export const FLOW_CANVAS_GRID_COLOR = 'var(--color-grid)';
export const FLOW_CANVAS_FIT_PADDING = 0.2;
export const FLOW_CANVAS_FIT_MAX_ZOOM = 1;
export const FLOW_CANVAS_PLACEHOLDER_ID = 'flow-canvas-placeholder';
export const FLOW_CANVAS_MIDDLE_MOUSE_BUTTON = 1;
export const FLOW_CANVAS_MIN_SELECTION_FOR_BAR = 2;
export const FLOW_CANVAS_PAN_KEY = 'Space';
export const FLOW_CANVAS_MULTI_SELECT_KEYS: readonly string[] = ['Meta', 'Control', 'Shift'];
export const FLOW_CANVAS_ZOOM_KEYS: readonly string[] = ['Meta', 'Control'];
export const FLOW_CANVAS_DROP_EFFECT = 'copy';
export const FLOW_CANVAS_EDGE_CORNER_RADIUS = 0;

export enum FlowCanvasKey {
  Delete = 'Delete',
  Backspace = 'Backspace',
  Enter = 'Enter',
  Escape = 'Escape',
  Undo = 'z',
  Duplicate = 'd',
}

export const FLOW_CANVAS_EDITABLE_SELECTOR = 'input, textarea, select, [contenteditable="true"]';
export const FLOW_CANVAS_NODE_SELECTOR = '.react-flow__node';
export const FLOW_CANVAS_NODE_ID_ATTRIBUTE = 'data-id';
export const FLOW_CANVAS_EDGE_SELECTOR = '[data-edge-id]';
export const FLOW_CANVAS_EDGE_ID_ATTRIBUTE = 'data-edge-id';
export const FLOW_CANVAS_MENU_FOCUS_SELECTOR = '[tabindex="0"]';

export enum FlowCanvasContextAction {
  Duplicate = 'duplicate',
  Delete = 'delete',
}
