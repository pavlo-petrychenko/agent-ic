import { FLOW_SCHEMA_VERSION, NodeType, PortName } from '@flow/document/constants/flow.constants';
import type { FlowDocument, FlowEdge, FlowNode } from '@flow/document/typedefs/flow.typedefs';
import { branchStarts, buildFlowGraph } from '@flow/scope/helpers/graph.helpers';
import type { FlowGraph } from '@flow/scope/typedefs/scope.typedefs';
import {
  FlowV1CompletionRole,
  UPGRADED_WAIT_FOR,
} from '@flow/versions/constants/version.constants';
import type { FlowV1Document, FlowV1Node } from '@flow/versions/typedefs/version.typedefs';

const upgradeNode = (node: FlowV1Node): FlowNode => {
  switch (node.type) {
    case NodeType.Completion: {
      const { prompt, model, reasoning, input, output } = node.config;
      return { ...node, config: { prompt, model, reasoning, input, output } };
    }
    case NodeType.Parallel:
      return { ...node, config: { waitFor: UPGRADED_WAIT_FOR[node.config.waitFor] } };
    default:
      return node;
  }
};

const isObserver = (node: FlowV1Node): boolean =>
  node.type === NodeType.Completion && node.config.role === FlowV1CompletionRole.Observer;

const startsObservedBranch = (
  graph: FlowGraph,
  observerIds: ReadonlySet<string>,
  edge: FlowEdge,
): boolean =>
  edge.sourcePort === PortName.Branches &&
  graph.nodes.get(edge.source)?.type === NodeType.Parallel &&
  observerIds.has(edge.target);

const backgroundEdgeIds = (
  graph: FlowGraph,
  observerIds: ReadonlySet<string>,
): ReadonlySet<string> => {
  const ids = new Set<string>();
  for (const node of graph.nodes.values()) {
    const starts = branchStarts(graph, node.id);
    const observed = starts.filter((edge) => startsObservedBranch(graph, observerIds, edge));
    const background = observed.length === starts.length ? observed.slice(1) : observed;
    for (const edge of background) {
      ids.add(edge.id);
    }
  }
  return ids;
};

export const upgradeFlowV1 = (flow: FlowV1Document): FlowDocument => {
  const observerIds = new Set(flow.nodes.filter(isObserver).map((node) => node.id));
  const upgraded: FlowDocument = {
    schemaVersion: FLOW_SCHEMA_VERSION,
    nodes: flow.nodes.map(upgradeNode),
    edges: flow.edges,
  };
  const background = backgroundEdgeIds(buildFlowGraph(upgraded), observerIds);
  return {
    ...upgraded,
    edges: upgraded.edges.map((edge) =>
      background.has(edge.id) ? { ...edge, background: true } : edge,
    ),
  };
};
