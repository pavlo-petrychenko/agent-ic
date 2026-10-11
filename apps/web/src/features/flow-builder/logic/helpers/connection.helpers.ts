import { PortName, isTriggerNode, nodePorts } from '@agent-ic/flow';
import type { FlowDocument } from '@agent-ic/flow';
import type { FlowConnection } from '@/features/flow-builder/typedefs/graphEdit.typedefs';

const reaches = (document: FlowDocument, from: string, to: string): boolean => {
  const seen = new Set<string>();
  const pending = [from];
  for (let current = pending.pop(); current !== undefined; current = pending.pop()) {
    if (current === to) {
      return true;
    }
    if (!seen.has(current)) {
      seen.add(current);
      pending.push(
        ...document.edges.filter((edge) => edge.source === current).map((edge) => edge.target),
      );
    }
  }
  return false;
};

export const canConnect = (document: FlowDocument, source: string, target: string): boolean => {
  const sourceNode = document.nodes.find((node) => node.id === source);
  const targetNode = document.nodes.find((node) => node.id === target);
  if (sourceNode === undefined || targetNode === undefined || source === target) {
    return false;
  }
  return (
    !isTriggerNode(targetNode) &&
    nodePorts(sourceNode).length > 0 &&
    !reaches(document, target, source)
  );
};

export const connect = (
  document: FlowDocument,
  connection: FlowConnection,
  edgeId: string,
): FlowDocument => {
  const sourceNode = document.nodes.find((node) => node.id === connection.source);
  const fitsPort =
    sourceNode !== undefined && nodePorts(sourceNode).includes(connection.sourcePort);
  const exists = document.edges.some(
    (edge) =>
      edge.source === connection.source &&
      edge.sourcePort === connection.sourcePort &&
      edge.target === connection.target,
  );
  if (!fitsPort || exists || !canConnect(document, connection.source, connection.target)) {
    return document;
  }
  const keepsOthers = connection.sourcePort === PortName.Branches;
  return {
    ...document,
    edges: [
      ...document.edges.filter(
        (edge) =>
          keepsOthers ||
          edge.source !== connection.source ||
          edge.sourcePort !== connection.sourcePort,
      ),
      { id: edgeId, ...connection },
    ],
  };
};
