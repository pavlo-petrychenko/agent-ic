import { NodeType, PortName } from '@flow/document/constants/flow.constants';
import { isTriggerNode } from '@flow/document/helpers/node.helpers';
import { nodePorts } from '@flow/document/helpers/port.helpers';
import type { FlowEdge, FlowNode } from '@flow/document/typedefs/flow.typedefs';
import { NODE_KEY_PATTERN } from '@flow/limits/constants/limit.constants';
import { CompletionRole } from '@flow/nodes/constants/step.constants';
import { RESERVED_ROOTS } from '@flow/scope/constants/scope.constants';
import { findCycleEdges } from '@flow/scope/helpers/graph.helpers';
import { FlowIssueCode } from '@flow/validation/constants/issue.constants';
import { createIssue, duplicates } from '@flow/validation/helpers/issue.helpers';
import type { FlowIssue, ValidationContext } from '@flow/validation/typedefs/validation.typedefs';

const keyIssues = (node: FlowNode): FlowIssue[] => {
  if (!NODE_KEY_PATTERN.test(node.key)) {
    return [
      createIssue(FlowIssueCode.InvalidNodeKey, { nodeId: node.id, params: { key: node.key } }),
    ];
  }
  if (RESERVED_ROOTS.includes(node.key)) {
    return [
      createIssue(FlowIssueCode.ReservedNodeKey, { nodeId: node.id, params: { key: node.key } }),
    ];
  }
  return [];
};

export const identityIssues = ({ flow }: ValidationContext): FlowIssue[] => [
  ...duplicates(flow.nodes, (node) => node.id).map((node) =>
    createIssue(FlowIssueCode.DuplicateNodeId, { nodeId: node.id }),
  ),
  ...flow.nodes.flatMap(keyIssues),
  ...duplicates(flow.nodes, (node) => node.key).map((node) =>
    createIssue(FlowIssueCode.DuplicateNodeKey, { nodeId: node.id, params: { key: node.key } }),
  ),
  ...duplicates(flow.edges, (edge) => edge.id).map((edge) =>
    createIssue(FlowIssueCode.DuplicateEdgeId, { edgeId: edge.id }),
  ),
];

const isObserver = (node: FlowNode): boolean =>
  node.type === NodeType.Completion && node.config.role === CompletionRole.Observer;

const edgeIssue = (context: ValidationContext, edge: FlowEdge): FlowIssue[] => {
  const source = context.graph.nodes.get(edge.source);
  const target = context.graph.nodes.get(edge.target);
  if (source === undefined || target === undefined) {
    return [createIssue(FlowIssueCode.EdgeMissingNode, { edgeId: edge.id })];
  }
  const issues: FlowIssue[] = [];
  if (isObserver(source)) {
    issues.push(
      createIssue(FlowIssueCode.ObserverHasEdges, { nodeId: source.id, edgeId: edge.id }),
    );
  } else if (!nodePorts(source).includes(edge.sourcePort)) {
    issues.push(
      createIssue(FlowIssueCode.EdgeMissingPort, {
        nodeId: source.id,
        edgeId: edge.id,
        params: { port: edge.sourcePort },
      }),
    );
  }
  if (isTriggerNode(target)) {
    issues.push(createIssue(FlowIssueCode.EdgeIntoTrigger, { nodeId: target.id, edgeId: edge.id }));
  }
  return issues;
};

const portCountIssues = ({ graph }: ValidationContext): FlowIssue[] => {
  const counts = new Map<string, { nodeId: string; port: string; count: number }>();
  for (const edges of graph.outgoing.values()) {
    for (const edge of edges) {
      if (edge.sourcePort === PortName.Branches) {
        continue;
      }
      const key = JSON.stringify([edge.source, edge.sourcePort]);
      const entry = counts.get(key) ?? { nodeId: edge.source, port: edge.sourcePort, count: 0 };
      counts.set(key, { ...entry, count: entry.count + 1 });
    }
  }
  return [...counts.values()]
    .filter((entry) => entry.count > 1)
    .map((entry) =>
      createIssue(FlowIssueCode.PortHasManyEdges, {
        nodeId: entry.nodeId,
        params: { port: entry.port, count: entry.count },
      }),
    );
};

export const edgeIssues = (context: ValidationContext): FlowIssue[] => [
  ...context.flow.edges.flatMap((edge) => edgeIssue(context, edge)),
  ...portCountIssues(context),
];

export const graphIssues = (context: ValidationContext): FlowIssue[] => {
  const { flow, graph, reachable } = context;
  if (!flow.nodes.some(isTriggerNode)) {
    return [createIssue(FlowIssueCode.NoTrigger)];
  }
  return [
    ...findCycleEdges(graph).map((edge) =>
      createIssue(FlowIssueCode.Cycle, { nodeId: edge.target, edgeId: edge.id }),
    ),
    ...[...graph.nodes.values()]
      .filter((node) => !reachable.has(node.id))
      .map((node) => createIssue(FlowIssueCode.UnreachableNode, { nodeId: node.id })),
  ];
};
