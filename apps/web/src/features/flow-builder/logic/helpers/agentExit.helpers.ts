import { AgentExitKind, FlowIssueCode, NodeType } from '@agent-ic/flow';
import type { AgentExit, AgentExits, FlowDocument, FlowIssue, FlowNode } from '@agent-ic/flow';
import { nodeName, updateNode } from '@/features/flow-builder/logic/helpers/inspector.helpers';

export const paletteAgentExits = (handoffWhen: string): AgentExits => ({
  [AgentExitKind.End]: null,
  [AgentExitKind.Handoff]: { when: handoffWhen },
});

export const withAgentExits = (node: FlowNode, exits: AgentExits): FlowNode =>
  node.type === NodeType.Agent ? { ...node, config: { ...node.config, exits } } : node;

export const setAgentExit = (
  document: FlowDocument,
  nodeId: string,
  kind: AgentExitKind,
  exit: AgentExit | null,
): FlowDocument => {
  const updated = updateNode(document, nodeId, (node) =>
    node.type === NodeType.Agent
      ? withAgentExits(node, { ...node.config.exits, [kind]: exit })
      : node,
  );
  return exit === null
    ? {
        ...updated,
        edges: updated.edges.filter((edge) => edge.source !== nodeId || edge.sourcePort !== kind),
      }
    : updated;
};

export const secondMessageStep = (
  document: FlowDocument,
  issues: readonly FlowIssue[],
  nodeId: string,
  kind: AgentExitKind,
): string | null => {
  const issue = issues.find(
    (candidate) =>
      candidate.code === FlowIssueCode.ExitEscalationMessage &&
      candidate.nodeId === nodeId &&
      candidate.params.exit === kind,
  );
  const edge = document.edges.find((candidate) => candidate.id === issue?.edgeId);
  const target = document.nodes.find((candidate) => candidate.id === edge?.target);
  return target === undefined ? null : nodeName(target);
};
