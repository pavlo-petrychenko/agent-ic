import { buildFlowGraph, isBackgroundBranch, isTriggerNode, nodePorts } from '@agent-ic/flow';
import type { FlowDocument, FlowIssue } from '@agent-ic/flow';
import { isBlocking } from '@/features/flow-builder/logic/helpers/issue.helpers';
import { nodeSummary, portLabel } from '@/features/flow-builder/logic/helpers/nodeSummary.helpers';
import type { CanvasModel } from '@/features/flow-builder/typedefs/flowBuilder.typedefs';
import type { ModelChoice } from '@/features/flow-builder/typedefs/llmStep.typedefs';

export const documentToCanvas = (
  document: FlowDocument,
  issues: readonly FlowIssue[],
  models: readonly ModelChoice[],
): CanvasModel => {
  const graph = buildFlowGraph(document);
  return {
    nodes: document.nodes.map((node) => {
      const own = issues.filter((issue) => issue.nodeId === node.id);
      return {
        id: node.id,
        key: node.key,
        type: node.type,
        label: node.label === '' ? node.key : node.label,
        position: node.position,
        hasInPort: !isTriggerNode(node),
        outPorts: nodePorts(node),
        portLabels: nodePorts(node).map((port) => portLabel(node, port)),
        summary: nodeSummary(node, models),
        issues: own,
        blocking: own.find(isBlocking) ?? null,
      };
    }),
    edges: document.edges.map((edge) => ({ ...edge, dashed: isBackgroundBranch(graph, edge) })),
  };
};
