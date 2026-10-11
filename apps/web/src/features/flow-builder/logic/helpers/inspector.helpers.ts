import { NODE_KEY_MAX_LENGTH, NODE_KEY_PATTERN, PortName, RESERVED_ROOTS } from '@agent-ic/flow';
import type { FlowDocument, FlowEdge, FlowIssue, FlowNode, ParallelNode } from '@agent-ic/flow';
import { NODE_KEY_SEPARATOR } from '@/features/flow-builder/constants/graphEdit.constants';
import {
  FIELD_HINTS,
  IssuePathSegment,
  KEY_EDGE_SEPARATORS,
  KEY_INVALID_CHARACTERS,
  PATH_JOINER,
} from '@/features/flow-builder/constants/inspector.constants';
import { NODE_PRESENTATION } from '@/features/flow-builder/constants/nodePresentation.constants';
import { reaches } from '@/features/flow-builder/logic/helpers/connection.helpers';
import { uniqueNodeKey } from '@/features/flow-builder/logic/helpers/nodeKey.helpers';
import type {
  BranchRow,
  FieldErrors,
  FieldRow,
  KeyRename,
  PortTarget,
} from '@/features/flow-builder/typedefs/inspector.typedefs';

export const nodeKeyFromLabel = (label: string): string | null => {
  const key = label
    .toLowerCase()
    .replace(KEY_INVALID_CHARACTERS, NODE_KEY_SEPARATOR)
    .replace(KEY_EDGE_SEPARATORS, '')
    .slice(0, NODE_KEY_MAX_LENGTH);
  return NODE_KEY_PATTERN.test(key) && !RESERVED_ROOTS.includes(key) ? key : null;
};

export const proposeKeyRename = (
  document: FlowDocument,
  nodeId: string,
  label: string,
): KeyRename | null => {
  const node = document.nodes.find((candidate) => candidate.id === nodeId);
  const wanted = nodeKeyFromLabel(label);
  if (node === undefined || wanted === null || wanted === node.key) {
    return null;
  }
  const to = uniqueNodeKey(document, wanted);
  return to === node.key ? null : { nodeId, from: node.key, to };
};

export const updateNode = (
  document: FlowDocument,
  nodeId: string,
  update: (node: FlowNode) => FlowNode,
): FlowDocument => ({
  ...document,
  nodes: document.nodes.map((node) => (node.id === nodeId ? update(node) : node)),
});

export const fieldErrors = (issues: readonly FlowIssue[], nodeId: string): FieldErrors => {
  const errors = new Map<string, FlowIssue>();
  for (const issue of issues) {
    const path = issue.path.join(PATH_JOINER);
    if (issue.nodeId === nodeId && !errors.has(path)) {
      errors.set(path, issue);
    }
  }
  return errors;
};

export const rulePath = (ruleIndex: number, segment: IssuePathSegment): string =>
  [IssuePathSegment.Rules, ruleIndex, segment].join(PATH_JOINER);

export const conditionPath = (
  ruleIndex: number,
  conditionIndex: number,
  segment: IssuePathSegment,
): string =>
  [IssuePathSegment.Rules, ruleIndex, IssuePathSegment.Conditions, conditionIndex, segment].join(
    PATH_JOINER,
  );

export const fieldRows = (variables: readonly Omit<FieldRow, 'hint'>[]): FieldRow[] =>
  variables.map(({ path, type, values }) => ({
    path,
    type,
    values,
    hint: FIELD_HINTS[path] ?? null,
  }));

export const nodeName = (node: FlowNode): string => (node.label === '' ? node.key : node.label);

export const portTargets = (document: FlowDocument, nodeId: string, port: string): PortTarget[] =>
  document.edges
    .filter((edge) => edge.source === nodeId && edge.sourcePort === port)
    .flatMap((edge) => {
      const target = document.nodes.find((node) => node.id === edge.target);
      return target === undefined ? [] : [{ nodeId: target.id, label: nodeName(target) }];
    });

const isBackground = (edge: FlowEdge): boolean =>
  edge.sourcePort === PortName.Branches && edge.background === true;

export const backgroundStepNames = (document: FlowDocument, nodeId: string): string[] => {
  const branches = document.edges.filter(
    (edge) => isBackground(edge) && reaches(document, edge.source, nodeId),
  );
  return document.nodes
    .filter(
      (node) =>
        !reaches(document, node.id, nodeId) &&
        !reaches(document, nodeId, node.id) &&
        branches.some((edge) => reaches(document, edge.target, node.id)),
    )
    .map(nodeName);
};

export const branchRows = (document: FlowDocument, node: ParallelNode): BranchRow[] => {
  const starts = document.edges.filter(
    (edge) => edge.source === node.id && edge.sourcePort === PortName.Branches,
  );
  const waited = starts.filter((edge) => !isBackground(edge)).length;
  return starts.flatMap((edge) => {
    const step = document.nodes.find((candidate) => candidate.id === edge.target);
    const background = isBackground(edge);
    return step === undefined
      ? []
      : [
          {
            nodeId: step.id,
            label: nodeName(step),
            ...NODE_PRESENTATION[step.type],
            edgeId: edge.id,
            background,
            lastWaited: !background && waited === 1,
          },
        ];
  });
};

export const setBranchBackground = (
  document: FlowDocument,
  edgeId: string,
  background: boolean,
): FlowDocument => ({
  ...document,
  edges: document.edges.map((edge) => (edge.id === edgeId ? { ...edge, background } : edge)),
});
