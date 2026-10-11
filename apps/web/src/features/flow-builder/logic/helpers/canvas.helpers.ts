import { isTriggerNode, nodePorts } from '@agent-ic/flow';
import type { FlowDocument, FlowIssue } from '@agent-ic/flow';
import type { CanvasModel } from '@/features/flow-builder/typedefs/flowBuilder.typedefs';

export const documentToCanvas = (
  document: FlowDocument,
  issues: readonly FlowIssue[],
): CanvasModel => ({
  nodes: document.nodes.map((node) => ({
    id: node.id,
    key: node.key,
    type: node.type,
    label: node.label === '' ? node.key : node.label,
    position: node.position,
    hasInPort: !isTriggerNode(node),
    outPorts: nodePorts(node),
    issues: issues.filter((issue) => issue.nodeId === node.id),
  })),
  edges: document.edges,
});
