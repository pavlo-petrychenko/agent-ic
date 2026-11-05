import { NodeType, TRIGGER_NODE_TYPES } from '@flow/document/constants/flow.constants';
import type { AgentNode, FlowNode, TriggerNode } from '@flow/document/typedefs/flow.typedefs';
import { AGENT_EXIT_KINDS, type AgentExitKind } from '@flow/nodes/constants/step.constants';

export const isTriggerNode = (node: FlowNode): node is TriggerNode =>
  TRIGGER_NODE_TYPES.includes(node.type);

export const enabledExits = (node: AgentNode): readonly AgentExitKind[] =>
  AGENT_EXIT_KINDS.filter((kind) => node.config.exits[kind] !== null);

export const isExitPort = (node: FlowNode, port: string): boolean =>
  node.type === NodeType.Agent && enabledExits(node).some((kind) => kind === port);
