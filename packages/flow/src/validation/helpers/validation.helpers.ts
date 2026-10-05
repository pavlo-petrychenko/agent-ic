import { isTriggerNode } from '@flow/document/helpers/node.helpers';
import type { FlowDocument } from '@flow/document/typedefs/flow.typedefs';
import {
  buildFlowGraph,
  nodesInParallelBranches,
  reachableFrom,
} from '@flow/scope/helpers/graph.helpers';
import { createScopeLookup } from '@flow/scope/helpers/scope.helpers';
import { FlowIssueCode, FlowIssueSeverity } from '@flow/validation/constants/issue.constants';
import {
  DOCUMENT_NODES_FIELD,
  NODE_ID_FIELD,
} from '@flow/validation/constants/validation.constants';
import { createIssue } from '@flow/validation/helpers/issue.helpers';
import { referenceIssues } from '@flow/validation/helpers/reference-rules.helpers';
import { parallelIssues, stepIssues } from '@flow/validation/helpers/step-rules.helpers';
import {
  edgeIssues,
  graphIssues,
  identityIssues,
} from '@flow/validation/helpers/structure-rules.helpers';
import { warningIssues } from '@flow/validation/helpers/warning-rules.helpers';
import type { FlowIssue, ValidationContext } from '@flow/validation/typedefs/validation.typedefs';
import { ParseFlowFailureKind } from '@flow/versions/constants/version.constants';
import { parseFlow } from '@flow/versions/helpers/version.helpers';
import type { ParseFlowFailure } from '@flow/versions/typedefs/version.typedefs';

const nodeIdAt = (input: unknown, path: readonly (string | number)[]): string | null => {
  const [field, index] = path;
  if (
    field !== DOCUMENT_NODES_FIELD ||
    typeof index !== 'number' ||
    typeof input !== 'object' ||
    input === null
  ) {
    return null;
  }
  const nodes: unknown = Reflect.get(input, DOCUMENT_NODES_FIELD);
  const node: unknown = Array.isArray(nodes) ? nodes[index] : null;
  const id: unknown =
    typeof node === 'object' && node !== null ? Reflect.get(node, NODE_ID_FIELD) : null;
  return typeof id === 'string' ? id : null;
};

const parseIssues = (input: unknown, failure: ParseFlowFailure): FlowIssue[] => {
  if (failure.kind === ParseFlowFailureKind.UnsupportedVersion) {
    return [
      createIssue(FlowIssueCode.UnsupportedVersion, {
        params: { version: String(failure.version) },
      }),
    ];
  }
  return failure.issues.map((issue) =>
    createIssue(FlowIssueCode.InvalidDocument, {
      nodeId: nodeIdAt(input, issue.path),
      path: issue.path.map(String),
      params: { code: issue.code, message: issue.message },
    }),
  );
};

const createContext = (flow: FlowDocument): ValidationContext => {
  const graph = buildFlowGraph(flow);
  return {
    flow,
    graph,
    reachable: reachableFrom(
      graph,
      flow.nodes.filter(isTriggerNode).map((node) => node.id),
    ),
    inBranches: nodesInParallelBranches(graph),
    scope: createScopeLookup(flow),
  };
};

export const validateFlow = (input: unknown): readonly FlowIssue[] => {
  const parsed = parseFlow(input);
  if (!parsed.ok) {
    return parseIssues(input, parsed.failure);
  }
  const context = createContext(parsed.flow);
  return [
    ...identityIssues(context),
    ...edgeIssues(context),
    ...graphIssues(context),
    ...stepIssues(context),
    ...parallelIssues(context),
    ...referenceIssues(context),
    ...warningIssues(context),
  ];
};

export const hasBlockingIssues = (issues: readonly FlowIssue[]): boolean =>
  issues.some((issue) => issue.severity === FlowIssueSeverity.Error);
