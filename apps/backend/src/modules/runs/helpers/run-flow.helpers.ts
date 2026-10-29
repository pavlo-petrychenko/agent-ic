import { EscalationMode, NodeType, enabledExits } from '@agent-ic/flow';
import type { AgentExitKind, FlowDocument, FlowNode } from '@agent-ic/flow';
import { RunStatus } from '@/modules/runs/constants/run.constants';
import type { FinishedRunStatus } from '@/modules/runs/typedefs/run.typedefs';

export const messageTriggerOf = (flow: FlowDocument): FlowNode | null =>
  flow.nodes.find((node) => node.type === NodeType.TriggerMessage) ?? null;

export const nextNode = (flow: FlowDocument, nodeId: string, port: string): FlowNode | null => {
  const edge = flow.edges.find((candidate) => {
    return candidate.source === nodeId && candidate.sourcePort === port;
  });
  return flow.nodes.find((node) => node.id === edge?.target) ?? null;
};

export const endStatusOf = (last: FlowNode): FinishedRunStatus =>
  last.type === NodeType.Escalation && last.config.mode === EscalationMode.Escalate
    ? RunStatus.Escalated
    : RunStatus.Succeeded;

export const defaultExitOf = (
  flow: FlowDocument,
  node: FlowNode,
  port: string | null,
): AgentExitKind | null => {
  if (node.type !== NodeType.Agent || port === null || nextNode(flow, node.id, port) !== null) {
    return null;
  }
  return enabledExits(node).find((kind) => kind === port) ?? null;
};
