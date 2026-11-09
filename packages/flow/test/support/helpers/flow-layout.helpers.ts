import { NodeType } from '@flow/document/constants/flow.constants';
import { enabledExits, isTriggerNode } from '@flow/document/helpers/node.helpers';
import { nodePorts } from '@flow/document/helpers/port.helpers';
import type { FlowDocument, FlowEdge, FlowNode } from '@flow/document/typedefs/flow.typedefs';
import { MessageContentKind } from '@flow/nodes/constants/step.constants';
import {
  LAYOUT_CHIP_ROW_HEIGHT,
  LAYOUT_HEADER_HEIGHT,
  LAYOUT_NODE_CLEARANCE,
  LAYOUT_NODE_WIDTH,
  LAYOUT_OUTPUT_PREFIX,
  LAYOUT_OUTPUT_SEPARATOR,
  LAYOUT_OVERLAP_TOLERANCE,
  LAYOUT_SUMMARY_BASE_HEIGHT,
  LAYOUT_SUMMARY_DEFAULT_LINES,
  LAYOUT_SUMMARY_LINE_CHARS,
  LAYOUT_SUMMARY_LINE_HEIGHT,
  LAYOUT_TERMINAL_HEIGHT,
  LAYOUT_TERMINAL_OFFSET_X,
  LAYOUT_TERMINAL_STACK,
  LAYOUT_TERMINAL_TOP,
  LAYOUT_TERMINAL_WIDTH,
  LAYOUT_TRIGGER_HEIGHT,
} from '@test/support/constants/flow-layout.constants';
import type {
  LayoutBox,
  LayoutEdgeOverlap,
  LayoutEdgePath,
  LayoutNodeHit,
  LayoutPoint,
  LayoutSegment,
  LayoutTerminal,
  LayoutTerminalHit,
} from '@test/support/typedefs/flow-layout.typedefs';

export const wrappedLines = (text: string): number =>
  text
    .split(/\s+/)
    .filter((word) => word !== '')
    .reduce(
      ({ lines, used }, word) => {
        if (used > 0 && used + 1 + word.length <= LAYOUT_SUMMARY_LINE_CHARS) {
          return { lines, used: used + 1 + word.length };
        }
        const extra = Math.max(Math.ceil(word.length / LAYOUT_SUMMARY_LINE_CHARS), 1);
        return {
          lines: lines + extra,
          used: word.length - (extra - 1) * LAYOUT_SUMMARY_LINE_CHARS,
        };
      },
      { lines: 0, used: 0 },
    ).lines;

const summaryLines = (node: FlowNode): number => {
  if (node.type === NodeType.SendMessage && node.config.content.kind === MessageContentKind.Text) {
    return wrappedLines(node.config.content.text);
  }
  if (node.type === NodeType.Completion) {
    const fields = node.config.output.map((field) => field.name).join(LAYOUT_OUTPUT_SEPARATOR);
    return wrappedLines(`${LAYOUT_OUTPUT_PREFIX}${fields}`);
  }
  return LAYOUT_SUMMARY_DEFAULT_LINES;
};

const chipRowsHeight = (node: FlowNode): number =>
  node.type === NodeType.Agent && node.config.knowledgeBaseIds.length > 0
    ? LAYOUT_CHIP_ROW_HEIGHT
    : 0;

export const layoutNodeHeight = (node: FlowNode): number => {
  if (isTriggerNode(node)) {
    return LAYOUT_TRIGGER_HEIGHT;
  }
  if (node.type === NodeType.Router || node.type === NodeType.Parallel) {
    return LAYOUT_HEADER_HEIGHT;
  }
  return (
    LAYOUT_SUMMARY_BASE_HEIGHT +
    LAYOUT_SUMMARY_LINE_HEIGHT * Math.max(summaryLines(node), 1) +
    chipRowsHeight(node)
  );
};

const nodeBox = (node: FlowNode, margin: number): LayoutBox => ({
  id: node.id,
  left: node.position.x - margin,
  top: node.position.y - margin,
  right: node.position.x + LAYOUT_NODE_WIDTH + margin,
  bottom: node.position.y + layoutNodeHeight(node) + margin,
});

const sourcePoint = (node: FlowNode, port: string): LayoutPoint => {
  const ports = nodePorts(node);
  const index = Math.max(ports.indexOf(port), 0);
  return {
    x: node.position.x + (LAYOUT_NODE_WIDTH * (index + 1)) / (ports.length + 1),
    y: node.position.y + layoutNodeHeight(node),
  };
};

const targetPoint = (node: FlowNode): LayoutPoint => ({
  x: node.position.x + LAYOUT_NODE_WIDTH / 2,
  y: node.position.y,
});

const isEmpty = ({ from, to }: LayoutSegment): boolean => from.x === to.x && from.y === to.y;

export const layoutEdgePath = (
  edge: FlowEdge,
  source: FlowNode,
  target: FlowNode,
): LayoutEdgePath => {
  const start = sourcePoint(source, edge.sourcePort);
  const end = targetPoint(target);
  const middle = (start.y + end.y) / 2;
  const corners: readonly LayoutPoint[] = [
    start,
    { x: start.x, y: middle },
    { x: end.x, y: middle },
    end,
  ];
  const segments = corners
    .slice(1)
    .map((to, index): LayoutSegment => ({ from: corners[index] ?? start, to, last: false }))
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

export const layoutEdgePaths = (flow: FlowDocument): readonly LayoutEdgePath[] => {
  const nodes = new Map(flow.nodes.map((node) => [node.id, node]));
  return flow.edges.flatMap((edge) => {
    const source = nodes.get(edge.source);
    const target = nodes.get(edge.target);
    return source === undefined || target === undefined
      ? []
      : [layoutEdgePath(edge, source, target)];
  });
};

const segmentCrossesBox = ({ from, to }: LayoutSegment, box: LayoutBox): boolean =>
  Math.max(from.x, to.x) > box.left &&
  Math.min(from.x, to.x) < box.right &&
  Math.max(from.y, to.y) > box.top &&
  Math.min(from.y, to.y) < box.bottom;

export const layoutNodeHits = (flow: FlowDocument): readonly LayoutNodeHit[] =>
  layoutEdgePaths(flow).flatMap((path) =>
    flow.nodes.flatMap((node) => {
      const own = node.id === path.source || node.id === path.target;
      const box = nodeBox(node, own ? 0 : LAYOUT_NODE_CLEARANCE);
      return path.segments.some((segment) => segmentCrossesBox(segment, box))
        ? [{ edgeId: path.edgeId, nodeId: node.id }]
        : [];
    }),
  );

const sharedLength = (aMin: number, aMax: number, bMin: number, bMax: number): number =>
  Math.min(aMax, bMax) - Math.max(aMin, bMin);

const segmentsOverlap = (a: LayoutSegment, b: LayoutSegment): boolean => {
  const vertical = a.from.x === a.to.x && b.from.x === b.to.x && a.from.x === b.from.x;
  const horizontal = a.from.y === a.to.y && b.from.y === b.to.y && a.from.y === b.from.y;
  if (vertical) {
    return (
      sharedLength(
        Math.min(a.from.y, a.to.y),
        Math.max(a.from.y, a.to.y),
        Math.min(b.from.y, b.to.y),
        Math.max(b.from.y, b.to.y),
      ) > LAYOUT_OVERLAP_TOLERANCE
    );
  }
  return (
    horizontal &&
    sharedLength(
      Math.min(a.from.x, a.to.x),
      Math.max(a.from.x, a.to.x),
      Math.min(b.from.x, b.to.x),
      Math.max(b.from.x, b.to.x),
    ) > LAYOUT_OVERLAP_TOLERANCE
  );
};

const pathsOverlap = (a: LayoutEdgePath, b: LayoutEdgePath): boolean => {
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

export const layoutEdgeOverlaps = (flow: FlowDocument): readonly LayoutEdgeOverlap[] => {
  const paths = layoutEdgePaths(flow);
  return paths.flatMap((first, index) =>
    paths
      .slice(index + 1)
      .filter((second) => pathsOverlap(first, second))
      .map((second) => ({ first: first.edgeId, second: second.edgeId })),
  );
};

const boxesOverlap = (a: LayoutBox, b: LayoutBox): boolean =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

export const layoutNodeOverlaps = (flow: FlowDocument): readonly LayoutEdgeOverlap[] =>
  flow.nodes.flatMap((first, index) =>
    flow.nodes
      .slice(index + 1)
      .filter((second) => boxesOverlap(nodeBox(first, LAYOUT_NODE_CLEARANCE), nodeBox(second, 0)))
      .map((second) => ({ first: first.id, second: second.id })),
  );

const unconnectedExits = (flow: FlowDocument, node: FlowNode): readonly string[] =>
  node.type === NodeType.Agent
    ? enabledExits(node).filter(
        (exit) => !flow.edges.some((edge) => edge.source === node.id && edge.sourcePort === exit),
      )
    : [];

export const layoutTerminals = (flow: FlowDocument): readonly LayoutTerminal[] =>
  flow.nodes.flatMap((node) =>
    unconnectedExits(flow, node).map((exit, stack): LayoutTerminal => {
      const port = sourcePoint(node, exit);
      const top = port.y + LAYOUT_TERMINAL_TOP + stack * LAYOUT_TERMINAL_STACK;
      const left = port.x - LAYOUT_TERMINAL_OFFSET_X;
      return {
        nodeId: node.id,
        exit,
        box: {
          id: `${node.id}.${exit}`,
          left,
          top,
          right: left + LAYOUT_TERMINAL_WIDTH,
          bottom: top + LAYOUT_TERMINAL_HEIGHT,
        },
      };
    }),
  );

export const layoutTerminalOverlaps = (flow: FlowDocument): readonly LayoutTerminalHit[] =>
  layoutTerminals(flow).flatMap((terminal) =>
    flow.nodes
      .filter((node) => boxesOverlap(terminal.box, nodeBox(node, LAYOUT_NODE_CLEARANCE)))
      .map((node) => ({ nodeId: terminal.nodeId, exit: terminal.exit, hitId: node.id })),
  );

export const layoutTerminalHits = (flow: FlowDocument): readonly LayoutTerminalHit[] =>
  layoutTerminals(flow).flatMap((terminal) =>
    layoutEdgePaths(flow)
      .filter((path) => path.segments.some((segment) => segmentCrossesBox(segment, terminal.box)))
      .map((path) => ({ nodeId: terminal.nodeId, exit: terminal.exit, hitId: path.edgeId })),
  );
