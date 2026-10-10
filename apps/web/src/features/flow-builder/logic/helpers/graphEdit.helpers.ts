import { renameNodeKey } from '@agent-ic/flow';
import type { FlowDocument, FlowNode } from '@agent-ic/flow';
import { DUPLICATE_OFFSET } from '@/features/flow-builder/constants/graphEdit.constants';
import { NODE_TEMPLATES } from '@/features/flow-builder/constants/nodeTemplate.constants';
import { uniqueNodeKey } from '@/features/flow-builder/logic/helpers/nodeKey.helpers';
import type {
  FlowPoint,
  FlowSelection,
} from '@/features/flow-builder/typedefs/flowBuilder.typedefs';
import type {
  AddableNodeType,
  FlowDuplicate,
  FlowNodeMove,
} from '@/features/flow-builder/typedefs/graphEdit.typedefs';

export const addNode = (
  document: FlowDocument,
  type: AddableNodeType,
  position: FlowPoint,
  id: string,
): FlowDocument => {
  const node: FlowNode = {
    id,
    key: uniqueNodeKey(document, type),
    label: '',
    position,
    ...structuredClone(NODE_TEMPLATES[type]),
  };
  return { ...document, nodes: [...document.nodes, node] };
};

export const removeElements = (document: FlowDocument, selection: FlowSelection): FlowDocument => {
  const nodeIds = new Set(selection.nodeIds);
  const edgeIds = new Set(selection.edgeIds);
  const nodes = document.nodes.filter((node) => !nodeIds.has(node.id));
  const edges = document.edges.filter(
    (edge) => !edgeIds.has(edge.id) && !nodeIds.has(edge.source) && !nodeIds.has(edge.target),
  );
  return nodes.length === document.nodes.length && edges.length === document.edges.length
    ? document
    : { ...document, nodes, edges };
};

export const moveNodes = (document: FlowDocument, moves: readonly FlowNodeMove[]): FlowDocument => {
  const positions = new Map(moves.map((move) => [move.id, move.position]));
  const nodes = document.nodes.map((node) => {
    const position = positions.get(node.id);
    return position === undefined ||
      (position.x === node.position.x && position.y === node.position.y)
      ? node
      : { ...node, position };
  });
  return nodes.every((node, index) => node === document.nodes[index])
    ? document
    : { ...document, nodes };
};

export const renameKey = (document: FlowDocument, nodeId: string, key: string): FlowDocument => {
  const node = document.nodes.find((candidate) => candidate.id === nodeId);
  return node === undefined ? document : renameNodeKey(document, node.key, key);
};

export const duplicateNodes = (
  document: FlowDocument,
  nodeIds: readonly string[],
  createId: () => string,
): FlowDuplicate => {
  if (!document.nodes.some((node) => nodeIds.includes(node.id))) {
    return { document, nodeIds: [] };
  }
  const copies = new Map<string, string>();
  const keys = new Map<string, string>();
  let taken = document;
  let copied: FlowDocument = { ...document, nodes: [], edges: [] };
  for (const node of document.nodes.filter((candidate) => nodeIds.includes(candidate.id))) {
    const id = createId();
    copies.set(node.id, id);
    const key = uniqueNodeKey(taken, node.key);
    keys.set(node.key, key);
    taken = { ...taken, nodes: [...taken.nodes, { ...node, key }] };
    const position = {
      x: node.position.x + DUPLICATE_OFFSET.x,
      y: node.position.y + DUPLICATE_OFFSET.y,
    };
    copied = { ...copied, nodes: [...copied.nodes, { ...structuredClone(node), id, position }] };
  }
  for (const [from, to] of keys) {
    copied = renameNodeKey(copied, from, to);
  }
  const nodes = [...document.nodes, ...copied.nodes];
  const edges = document.edges.flatMap((edge) => {
    const source = copies.get(edge.source);
    const target = copies.get(edge.target);
    return source === undefined || target === undefined
      ? []
      : [{ ...edge, id: createId(), source, target }];
  });
  return {
    document: { ...document, nodes, edges: [...document.edges, ...edges] },
    nodeIds: [...copies.values()],
  };
};
