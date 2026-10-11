import {
  CompletionRole,
  NODE_KEY_MAX_LENGTH,
  NODE_KEY_PATTERN,
  NodeType,
  RESERVED_ROOTS,
  WaitFor,
} from '@agent-ic/flow';
import type { FlowDocument, FlowNode, ParallelNode } from '@agent-ic/flow';
import { NODE_KEY_SEPARATOR } from '@/features/flow-builder/constants/graphEdit.constants';
import {
  BranchRole,
  FIELD_HINTS,
  KEY_EDGE_SEPARATORS,
  KEY_INVALID_CHARACTERS,
} from '@/features/flow-builder/constants/inspector.constants';
import { NODE_PRESENTATION } from '@/features/flow-builder/constants/nodePresentation.constants';
import { uniqueNodeKey } from '@/features/flow-builder/logic/helpers/nodeKey.helpers';
import type {
  BranchRow,
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

const isObserver = (node: FlowNode): boolean =>
  node.type === NodeType.Completion && node.config.role === CompletionRole.Observer;

const branchRole = (waitFor: WaitFor, observer: boolean): BranchRole => {
  if (waitFor === WaitFor.First) {
    return BranchRole.Racing;
  }
  return waitFor === WaitFor.Guards && observer ? BranchRole.Observer : BranchRole.Waited;
};

export const branchRows = (document: FlowDocument, node: ParallelNode, port: string): BranchRow[] =>
  portTargets(document, node.id, port).flatMap((target) => {
    const step = document.nodes.find((candidate) => candidate.id === target.nodeId);
    return step === undefined
      ? []
      : [
          {
            ...target,
            ...NODE_PRESENTATION[step.type],
            role: branchRole(node.config.waitFor, isObserver(step)),
          },
        ];
  });
