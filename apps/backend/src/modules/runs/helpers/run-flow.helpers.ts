import { EscalationMode, NodeType, enabledExits, isTriggerNode } from '@agent-ic/flow';
import type { AgentExitKind, FlowDocument, FlowNode, TriggerNode } from '@agent-ic/flow';
import { RunStatus } from '@/modules/runs/constants/run.constants';
import type { FinishedRunStatus, Run } from '@/modules/runs/typedefs/run.typedefs';

export const triggerNodeOf = (
  flow: FlowDocument,
  { triggerNodeId }: Pick<Run, 'triggerNodeId'>,
): TriggerNode | null =>
  flow.nodes
    .filter(isTriggerNode)
    .find((node) =>
      triggerNodeId === null ? node.type === NodeType.TriggerMessage : node.id === triggerNodeId,
    ) ?? null;

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
