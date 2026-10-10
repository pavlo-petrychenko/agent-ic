import { NODE_IDENTITY_FIELDS } from '@flow/diff/constants/diff.constants';
import type {
  FieldChange,
  Fields,
  FlowDiff,
  KeyRename,
  NodeChange,
} from '@flow/diff/typedefs/diff.typedefs';
import { renameKeyReferences } from '@flow/document/helpers/rename.helpers';
import type { FlowDocument, FlowEdge, FlowNode } from '@flow/document/typedefs/flow.typedefs';

const isFields = (value: unknown): value is Fields =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const sameValue = (a: unknown, b: unknown): boolean => {
  if ((a ?? null) === null && (b ?? null) === null) {
    return true;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, index) => sameValue(item, b[index]));
  }
  if (isFields(a) && isFields(b)) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    return [...keys].every((key) => sameValue(a[key], b[key]));
  }
  return Object.is(a, b);
};

const fieldChanges = (before: Fields, after: Fields, path: readonly string[]): FieldChange[] =>
  [...new Set([...Object.keys(before), ...Object.keys(after)])].flatMap((name) => {
    const old = before[name];
    const next = after[name];
    const fieldPath = [...path, name];
    if (isFields(old) && isFields(next)) {
      return fieldChanges(old, next, fieldPath);
    }
    return sameValue(old, next)
      ? []
      : [{ path: fieldPath, before: old ?? null, after: next ?? null }];
  });

const valueAt = (fields: Fields, path: readonly string[]): unknown =>
  path.reduce<unknown>((value, name) => (isFields(value) ? value[name] : undefined), fields);

const withoutIdentity = (node: FlowNode): Fields =>
  Object.fromEntries(Object.entries(node).filter(([name]) => !NODE_IDENTITY_FIELDS.includes(name)));

const edgeKey = (edge: FlowEdge): string =>
  JSON.stringify([edge.source, edge.sourcePort, edge.target]);

const edgesMissingFrom = (edges: readonly FlowEdge[], other: readonly FlowEdge[]): FlowEdge[] => {
  const keys = new Set(other.map(edgeKey));
  return edges.filter((edge) => !keys.has(edgeKey(edge)));
};

export const diffFlows = (a: FlowDocument, b: FlowDocument): FlowDiff => {
  const before = new Map(a.nodes.map((node) => [node.id, node]));
  const after = new Map(b.nodes.map((node) => [node.id, node]));
  const kept = b.nodes.flatMap((node) => {
    const old = before.get(node.id);
    return old === undefined ? [] : [{ old, node }];
  });
  const renamedKeys: KeyRename[] = kept
    .filter(({ old, node }) => old.key !== node.key)
    .map(({ old, node }) => ({ nodeId: node.id, from: old.key, to: node.key }));
  const renames = new Map(renamedKeys.map(({ from, to }) => [from, to]));
  const changedNodes: NodeChange[] = kept.flatMap(({ old, node }) => {
    const fields = fieldChanges(
      withoutIdentity(renameKeyReferences(old, renames)),
      withoutIdentity(node),
      [],
    ).map((change) => ({ ...change, before: valueAt(old, change.path) ?? null }));
    return fields.length === 0 ? [] : [{ nodeId: node.id, key: node.key, type: node.type, fields }];
  });
  return {
    addedNodes: b.nodes.filter((node) => !before.has(node.id)),
    removedNodes: a.nodes.filter((node) => !after.has(node.id)),
    changedNodes,
    renamedKeys,
    addedEdges: edgesMissingFrom(b.edges, a.edges),
    removedEdges: edgesMissingFrom(a.edges, b.edges),
  };
};

export const countFlowChanges = (diff: FlowDiff): number =>
  diff.addedNodes.length +
  diff.removedNodes.length +
  diff.changedNodes.length +
  diff.renamedKeys.length +
  diff.addedEdges.length +
  diff.removedEdges.length;
