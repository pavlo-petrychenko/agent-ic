import { NodeType, PortName } from '@flow/document/constants/flow.constants';
import type { FlowDocument, FlowEdge, FlowNode } from '@flow/document/typedefs/flow.typedefs';
import type { FlowGraph } from '@flow/scope/typedefs/scope.typedefs';

const NO_EDGES: readonly FlowEdge[] = [];

const append = (map: Map<string, FlowEdge[]>, key: string, edge: FlowEdge): void => {
  const list = map.get(key);
  if (list === undefined) {
    map.set(key, [edge]);
  } else {
    list.push(edge);
  }
};

export const buildFlowGraph = (flow: FlowDocument): FlowGraph => {
  const nodes = new Map<string, FlowNode>();
  for (const node of flow.nodes) {
    if (!nodes.has(node.id)) {
      nodes.set(node.id, node);
    }
  }
  const outgoing = new Map<string, FlowEdge[]>();
  const incoming = new Map<string, FlowEdge[]>();
  for (const edge of flow.edges) {
    if (nodes.has(edge.source) && nodes.has(edge.target)) {
      append(outgoing, edge.source, edge);
      append(incoming, edge.target, edge);
    }
  }
  return { nodes, outgoing, incoming };
};

export const outgoingEdges = (
  graph: FlowGraph,
  nodeId: string,
  port: string | null = null,
): readonly FlowEdge[] => {
  const edges = graph.outgoing.get(nodeId) ?? NO_EDGES;
  return port === null ? edges : edges.filter((edge) => edge.sourcePort === port);
};

export const incomingEdges = (graph: FlowGraph, nodeId: string): readonly FlowEdge[] =>
  graph.incoming.get(nodeId) ?? NO_EDGES;

export const reachableFrom = (
  graph: FlowGraph,
  startIds: Iterable<string>,
): ReadonlySet<string> => {
  const seen = new Set<string>();
  const stack = [...startIds].filter((id) => graph.nodes.has(id));
  while (stack.length > 0) {
    const id = stack.pop();
    if (id === undefined || seen.has(id)) {
      continue;
    }
    seen.add(id);
    for (const edge of outgoingEdges(graph, id)) {
      stack.push(edge.target);
    }
  }
  return seen;
};

export const branchStarts = (graph: FlowGraph, parallelId: string): readonly FlowEdge[] =>
  outgoingEdges(graph, parallelId, PortName.Branches);

export const branchNodes = (graph: FlowGraph, start: FlowEdge): ReadonlySet<string> =>
  reachableFrom(graph, [start.target]);

export const nodesInParallelBranches = (graph: FlowGraph): ReadonlySet<string> => {
  const inside = new Set<string>();
  for (const node of graph.nodes.values()) {
    if (node.type === NodeType.Parallel) {
      for (const start of branchStarts(graph, node.id)) {
        for (const id of branchNodes(graph, start)) {
          inside.add(id);
        }
      }
    }
  }
  return inside;
};

export const findCycleEdges = (graph: FlowGraph): readonly FlowEdge[] => {
  const done = new Set<string>();
  const onPath = new Set<string>();
  const backEdges: FlowEdge[] = [];
  const visit = (id: string): void => {
    onPath.add(id);
    for (const edge of outgoingEdges(graph, id)) {
      if (onPath.has(edge.target)) {
        backEdges.push(edge);
      } else if (!done.has(edge.target)) {
        visit(edge.target);
      }
    }
    onPath.delete(id);
    done.add(id);
  };
  for (const id of graph.nodes.keys()) {
    if (!done.has(id)) {
      visit(id);
    }
  }
  return backEdges;
};
