import { TRIGGER_NODE_TYPES } from '@flow/document/constants/flow.constants';
import type { FlowNode, TriggerNode } from '@flow/document/typedefs/flow.typedefs';

export const isTriggerNode = (node: FlowNode): node is TriggerNode =>
  TRIGGER_NODE_TYPES.includes(node.type);
