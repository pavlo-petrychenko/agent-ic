import { NODE_KEY_MAX_LENGTH, NODE_KEY_PATTERN, RESERVED_ROOTS } from '@agent-ic/flow';
import type { FlowDocument, FlowNode, NodeType } from '@agent-ic/flow';
import { NODE_KEY_SEPARATOR } from '@/features/flow-builder/constants/graphEdit.constants';
import {
  FIELD_HINTS,
  KEY_EDGE_SEPARATORS,
  KEY_INVALID_CHARACTERS,
} from '@/features/flow-builder/constants/inspector.constants';
import { uniqueNodeKey } from '@/features/flow-builder/logic/helpers/nodeKey.helpers';
import type { FieldRow, KeyRename } from '@/features/flow-builder/typedefs/inspector.typedefs';

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

export const nodeName = (node: FlowNode, fallback: (type: NodeType) => string): string =>
  node.label === '' ? fallback(node.type) : node.label;
