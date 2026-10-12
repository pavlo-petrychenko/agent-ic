import { nodePorts } from '@agent-ic/flow';
import type { FlowDocument, FlowEdge, FlowNode } from '@agent-ic/flow';
import {
  EXAMPLE_NODE_CLEARANCE,
  EXAMPLE_NODE_HEIGHT,
  EXAMPLE_NODE_WIDTH,
  EXAMPLE_OVERLAP_TOLERANCE,
} from '@/modules/agents/constants/flow-example-geometry.constants';
import type {
  ExampleBox,
  ExampleEdgeOverlap,
  ExampleEdgePath,
  ExampleNodeHit,
  ExamplePoint,
  ExampleSegment,
} from '@/modules/agents/typedefs/flow-example-geometry.typedefs';

const nodeBox = (node: FlowNode, margin: number): ExampleBox => ({
  id: node.id,
  left: node.position.x - margin,
  top: node.position.y - margin,
  right: node.position.x + EXAMPLE_NODE_WIDTH + margin,
  bottom: node.position.y + EXAMPLE_NODE_HEIGHT + margin,
});

const sourcePoint = (node: FlowNode, port: string): ExamplePoint => {
  const ports = nodePorts(node);
  const index = Math.max(ports.indexOf(port), 0);
  return {
    x: node.position.x + (EXAMPLE_NODE_WIDTH * (index + 1)) / (ports.length + 1),
    y: node.position.y + EXAMPLE_NODE_HEIGHT,
  };
};

const targetPoint = (node: FlowNode): ExamplePoint => ({
  x: node.position.x + EXAMPLE_NODE_WIDTH / 2,
  y: node.position.y,
});

const isEmpty = ({ from, to }: ExampleSegment): boolean => from.x === to.x && from.y === to.y;

export const exampleEdgePath = (
  edge: FlowEdge,
  source: FlowNode,
  target: FlowNode,
): ExampleEdgePath => {
  const start = sourcePoint(source, edge.sourcePort);
  const end = targetPoint(target);
  const middle = (start.y + end.y) / 2;
  const corners: readonly ExamplePoint[] = [
    start,
    { x: start.x, y: middle },
    { x: end.x, y: middle },
    end,
  ];
  const segments = corners
    .slice(1)
    .map((to, index): ExampleSegment => ({ from: corners[index] ?? start, to, last: false }))
    .filter((segment) => !isEmpty(segment));
  return {
    edgeId: edge.id,
    source: edge.source,
    sourcePort: edge.sourcePort,
    target: edge.target,
    segments: segments.map((segment, index) => ({
      ...segment,
      last: index === segments.length - 1,
    })),
  };
};

export const exampleEdgePaths = (flow: FlowDocument): readonly ExampleEdgePath[] => {
  const nodes = new Map(flow.nodes.map((node) => [node.id, node]));
  return flow.edges.flatMap((edge) => {
    const source = nodes.get(edge.source);
    const target = nodes.get(edge.target);
    return source === undefined || target === undefined
      ? []
      : [exampleEdgePath(edge, source, target)];
  });
};

const segmentCrossesBox = ({ from, to }: ExampleSegment, box: ExampleBox): boolean =>
  Math.max(from.x, to.x) > box.left &&
  Math.min(from.x, to.x) < box.right &&
  Math.max(from.y, to.y) > box.top &&
  Math.min(from.y, to.y) < box.bottom;

export const exampleNodeHits = (flow: FlowDocument): readonly ExampleNodeHit[] =>
  exampleEdgePaths(flow).flatMap((path) =>
    flow.nodes.flatMap((node) => {
      const own = node.id === path.source || node.id === path.target;
      const box = nodeBox(node, own ? 0 : EXAMPLE_NODE_CLEARANCE);
      return path.segments.some((segment) => segmentCrossesBox(segment, box))
        ? [{ edgeId: path.edgeId, nodeId: node.id }]
        : [];
    }),
  );

const sharedLength = (aMin: number, aMax: number, bMin: number, bMax: number): number =>
  Math.min(aMax, bMax) - Math.max(aMin, bMin);

const segmentsOverlap = (a: ExampleSegment, b: ExampleSegment): boolean => {
  const vertical = a.from.x === a.to.x && b.from.x === b.to.x && a.from.x === b.from.x;
  const horizontal = a.from.y === a.to.y && b.from.y === b.to.y && a.from.y === b.from.y;
  if (vertical) {
    return (
      sharedLength(
        Math.min(a.from.y, a.to.y),
        Math.max(a.from.y, a.to.y),
        Math.min(b.from.y, b.to.y),
        Math.max(b.from.y, b.to.y),
      ) > EXAMPLE_OVERLAP_TOLERANCE
    );
  }
  return (
    horizontal &&
    sharedLength(
      Math.min(a.from.x, a.to.x),
      Math.max(a.from.x, a.to.x),
      Math.min(b.from.x, b.to.x),
      Math.max(b.from.x, b.to.x),
    ) > EXAMPLE_OVERLAP_TOLERANCE
  );
};

const pathsOverlap = (a: ExampleEdgePath, b: ExampleEdgePath): boolean => {
  if (a.source === b.source && a.sourcePort === b.sourcePort) {
    return false;
  }
  return a.segments.some((first) =>
    b.segments.some(
      (second) =>
        !(first.last && second.last && a.target === b.target) && segmentsOverlap(first, second),
    ),
  );
};

export const exampleEdgeOverlaps = (flow: FlowDocument): readonly ExampleEdgeOverlap[] => {
  const paths = exampleEdgePaths(flow);
  return paths.flatMap((first, index) =>
    paths
      .slice(index + 1)
      .filter((second) => pathsOverlap(first, second))
      .map((second) => ({ first: first.edgeId, second: second.edgeId })),
  );
};
