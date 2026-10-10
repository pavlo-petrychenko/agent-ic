import { isTriggerNode, nodePorts } from '@agent-ic/flow';
import type { FlowDocument, FlowIssue } from '@agent-ic/flow';
import { isBlocking } from '@/features/flow-builder/logic/helpers/issue.helpers';
import { nodeSummary, portLabel } from '@/features/flow-builder/logic/helpers/nodeSummary.helpers';
import type { CanvasModel } from '@/features/flow-builder/typedefs/flowBuilder.typedefs';

export const documentToCanvas = (
  document: FlowDocument,
  issues: readonly FlowIssue[],
): CanvasModel => ({
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
      summary: nodeSummary(node),
      issues: own,
      blocking: own.find(isBlocking) ?? null,
    };
  }),
  edges: document.edges,
});
