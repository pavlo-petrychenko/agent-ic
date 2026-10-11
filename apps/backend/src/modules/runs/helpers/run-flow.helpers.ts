import { NodeType } from '@agent-ic/flow';
import type { FlowDocument, FlowNode } from '@agent-ic/flow';

export const messageTriggerOf = (flow: FlowDocument): FlowNode | null =>
  flow.nodes.find((node) => node.type === NodeType.TriggerMessage) ?? null;

export const nextNode = (flow: FlowDocument, nodeId: string, port: string): FlowNode | null => {
  const edge = flow.edges.find((candidate) => {
    return candidate.source === nodeId && candidate.sourcePort === port;
  });
  return flow.nodes.find((node) => node.id === edge?.target) ?? null;
};
