import type { FlowDocument, NodeType } from '@agent-ic/flow';
import { NODE_PRESENTATION } from '@/features/flow-builder/constants/nodePresentation.constants';
import type { FlowThumbnailGraph } from '@/features/flow-builder/typedefs/flowThumbnail.typedefs';

export const toFlowThumbnail = (
  flow: FlowDocument,
  highlight: NodeType | null = null,
): FlowThumbnailGraph => ({
  nodes: flow.nodes.map((node) => ({
    id: node.id,
    kind: NODE_PRESENTATION[node.type].kind,
    icon: NODE_PRESENTATION[node.type].icon,
    label: node.label === '' ? node.key : node.label,
    x: node.position.x,
    y: node.position.y,
    highlighted: highlight !== null && node.type === highlight,
  })),
  edges: flow.edges.map((edge) => ({ id: edge.id, source: edge.source, target: edge.target })),
});
