import { useMemo } from 'react';
import { NODE_KIND_DEFAULT_ICONS } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import {
  FLOW_THUMBNAIL_CHAR_WIDTH_RATIO,
  FLOW_THUMBNAIL_ELLIPSIS,
  FLOW_THUMBNAIL_METRICS,
  FLOW_THUMBNAIL_MIN_CURVE,
  FLOW_THUMBNAIL_MIN_STEP,
} from '@/shared/ui/flow/FlowThumbnail/FlowThumbnail.constants';
import type {
  FlowThumbnailMetrics,
  FlowThumbnailSize,
} from '@/shared/ui/flow/FlowThumbnail/FlowThumbnail.constants';
import type {
  FlowThumbnailEdge,
  FlowThumbnailLayout,
  FlowThumbnailNode,
  FlowThumbnailPlacedEdge,
  FlowThumbnailPlacedNode,
} from '@/shared/ui/flow/FlowThumbnail/FlowThumbnail.typedefs';

interface Point {
  x: number;
  y: number;
}

const round = (value: number): number => Math.round(value * 100) / 100;

const truncate = (label: string, maxChars: number): string => {
  if (label.length <= maxChars) {
    return label;
  }
  const kept = Math.max(maxChars - 1, 1);
  return `${label.slice(0, kept).trimEnd()}${FLOW_THUMBNAIL_ELLIPSIS}`;
};

const labelCapacity = (metrics: FlowThumbnailMetrics): number => {
  const start = metrics.badgeInset + metrics.badgeSize + metrics.labelGap;
  const available = metrics.nodeWidth - start - metrics.labelPadEnd;
  return Math.floor(available / (metrics.fontSize * FLOW_THUMBNAIL_CHAR_WIDTH_RATIO));
};

const stepPath = (from: Point, to: Point, radius: number): string => {
  if (from.x === to.x) {
    return `M${from.x},${from.y} V${to.y}`;
  }
  const midY = from.y + (to.y - from.y) / 2;
  const dir = to.x > from.x ? 1 : -1;
  const corner = Math.min(radius, Math.abs(to.x - from.x) / 2, (to.y - from.y) / 2);
  return [
    `M${from.x},${from.y}`,
    `V${midY - corner}`,
    `Q${from.x},${midY} ${from.x + dir * corner},${midY}`,
    `H${to.x - dir * corner}`,
    `Q${to.x},${midY} ${to.x},${midY + corner}`,
    `V${to.y}`,
  ].join(' ');
};

const curvePath = (from: Point, to: Point): string => {
  const reach = Math.max(FLOW_THUMBNAIL_MIN_CURVE, Math.abs(to.y - from.y) / 2);
  return `M${from.x},${from.y} C${from.x},${from.y + reach} ${to.x},${to.y - reach} ${to.x},${to.y}`;
};

const edgePath = (from: Point, to: Point, radius: number): string =>
  to.y - from.y >= FLOW_THUMBNAIL_MIN_STEP ? stepPath(from, to, radius) : curvePath(from, to);

const placeNodes = (
  nodes: readonly FlowThumbnailNode[],
  metrics: FlowThumbnailMetrics,
): readonly FlowThumbnailPlacedNode[] => {
  const minX = Math.min(...nodes.map((node) => node.x));
  const minY = Math.min(...nodes.map((node) => node.y));
  const capacity = metrics.showLabels ? labelCapacity(metrics) : 0;
  return nodes.map((node) => ({
    id: node.id,
    kind: node.kind,
    icon: node.icon ?? NODE_KIND_DEFAULT_ICONS[node.kind],
    title: node.label,
    text: metrics.showLabels ? truncate(node.label, capacity) : '',
    x: round(metrics.padding + (node.x - minX) * metrics.scale),
    y: round(metrics.padding + (node.y - minY) * metrics.scale),
    highlighted: node.highlighted ?? false,
  }));
};

const placeEdges = (
  edges: readonly FlowThumbnailEdge[],
  placed: readonly FlowThumbnailPlacedNode[],
  metrics: FlowThumbnailMetrics,
  dimming: boolean,
): readonly FlowThumbnailPlacedEdge[] => {
  const byId = new Map(placed.map((node) => [node.id, node]));
  return edges.flatMap((edge) => {
    const source = byId.get(edge.source);
    const target = byId.get(edge.target);
    if (source === undefined || target === undefined) {
      return [];
    }
    const from = { x: source.x + metrics.nodeWidth / 2, y: source.y + metrics.nodeHeight };
    const to = { x: target.x + metrics.nodeWidth / 2, y: target.y };
    return [
      {
        id: edge.id,
        path: edgePath(from, to, metrics.cornerRadius),
        dimmed: dimming && !source.highlighted && !target.highlighted,
      },
    ];
  });
};

export function useFlowThumbnailLayout(
  nodes: readonly FlowThumbnailNode[],
  edges: readonly FlowThumbnailEdge[],
  size: FlowThumbnailSize,
): FlowThumbnailLayout {
  return useMemo(() => {
    const metrics = FLOW_THUMBNAIL_METRICS[size];
    const placed = placeNodes(nodes, metrics);
    const dimming = placed.some((node) => node.highlighted);
    const right = Math.max(0, ...placed.map((node) => node.x + metrics.nodeWidth));
    const bottom = Math.max(0, ...placed.map((node) => node.y + metrics.nodeHeight));
    return {
      width: round(right + metrics.padding),
      height: round(bottom + metrics.padding),
      nodes: placed,
      edges: placeEdges(edges, placed, metrics, dimming),
      dimming,
    };
  }, [nodes, edges, size]);
}
