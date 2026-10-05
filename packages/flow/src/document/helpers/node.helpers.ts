import { TRIGGER_NODE_TYPES } from '../constants/flow.constants';
import type { FlowNode, TriggerNode } from '../typedefs/flow.typedefs';

export const isTriggerNode = (node: FlowNode): node is TriggerNode =>
  TRIGGER_NODE_TYPES.includes(node.type);
