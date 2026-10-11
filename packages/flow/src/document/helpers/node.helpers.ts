import { NodeType, TRIGGER_NODE_TYPES } from '@flow/document/constants/flow.constants';
import type { FlowNode, TriggerNode } from '@flow/document/typedefs/flow.typedefs';
import { CompletionRole } from '@flow/nodes/constants/step.constants';

export const isTriggerNode = (node: FlowNode): node is TriggerNode =>
  TRIGGER_NODE_TYPES.includes(node.type);

export const isObserverNode = (node: FlowNode): boolean =>
  node.type === NodeType.Completion && node.config.role === CompletionRole.Observer;
