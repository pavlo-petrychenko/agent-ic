import { isTriggerNode, nodePorts } from '@agent-ic/flow';
import type { FlowDocument } from '@agent-ic/flow';
import { FIRST_STEP_POSITION } from '@/features/flow-builder/constants/flowBuilder.constants';
import {
  NEW_STEP_GAP,
  NEW_TRIGGER_GAP,
  NODE_FOOTPRINT,
} from '@/features/flow-builder/constants/palette.constants';
import { withAgentExits } from '@/features/flow-builder/logic/helpers/agentExit.helpers';
import { connect } from '@/features/flow-builder/logic/helpers/connection.helpers';
import { addNode, removeElements } from '@/features/flow-builder/logic/helpers/graphEdit.helpers';
import type { FlowPoint } from '@/features/flow-builder/typedefs/flowBuilder.typedefs';
import type { StepAnchor, StepPlacement } from '@/features/flow-builder/typedefs/palette.typedefs';
import { UTC_TIME_ZONE } from '@/shared/forms/constants/timeZone.constants';

const withPlacement = (
  document: FlowDocument,
  nodeId: string,
  placement: StepPlacement,
): FlowDocument => ({
  ...document,
  nodes: document.nodes.map((node) =>
    node.id === nodeId
      ? withAgentExits({ ...node, label: placement.label }, placement.agentExits)
      : node,
  ),
});

const splitEdge = (
  document: FlowDocument,
  nodeId: string,
  edgeId: string,
  createId: () => string,
): FlowDocument => {
  const edge = document.edges.find((candidate) => candidate.id === edgeId);
  const node = document.nodes.find((candidate) => candidate.id === nodeId);
  const port = node === undefined ? undefined : nodePorts(node)[0];
  if (edge === undefined || node === undefined || port === undefined || isTriggerNode(node)) {
    return document;
  }
  const opened = removeElements(document, { nodeIds: [], edgeIds: [edgeId] });
  const into = connect(
    opened,
    { source: edge.source, sourcePort: edge.sourcePort, target: nodeId },
    createId(),
  );
  return connect(into, { source: nodeId, sourcePort: port, target: edge.target }, createId());
};

const overlaps = (a: FlowPoint, b: FlowPoint): boolean =>
  Math.abs(a.x - b.x) < NODE_FOOTPRINT.width && Math.abs(a.y - b.y) < NODE_FOOTPRINT.height;

export const clearOfNodes = (document: FlowDocument, position: FlowPoint): FlowPoint => {
  let free = position;
  for (let pass = 0; pass <= document.nodes.length; pass += 1) {
    const blocker = document.nodes.find((node) => overlaps(node.position, free));
    if (blocker === undefined) {
      return free;
    }
    free = { x: free.x, y: blocker.position.y + NODE_FOOTPRINT.height };
  }
  return free;
};

export const placeStep = (
  document: FlowDocument,
  placement: StepPlacement,
  createId: () => string,
  timeZone: string = UTC_TIME_ZONE,
): FlowDocument => {
  const nodeId = createId();
  const added = withPlacement(
    addNode(document, placement.type, clearOfNodes(document, placement.position), nodeId, timeZone),
    nodeId,
    placement,
  );
  if (placement.splitEdgeId !== null) {
    return splitEdge(added, nodeId, placement.splitEdgeId, createId);
  }
  return placement.after === null
    ? added
    : connect(added, { ...placement.after, target: nodeId }, createId());
};

export const belowLowestNode = (document: FlowDocument): FlowPoint => {
  const lowest = document.nodes.reduce<FlowDocument['nodes'][number] | null>(
    (current, node) => (current === null || node.position.y > current.position.y ? node : current),
    null,
  );
  return lowest === null
    ? FIRST_STEP_POSITION
    : { x: lowest.position.x, y: lowest.position.y + NEW_STEP_GAP };
};

export const nextTriggerPosition = (document: FlowDocument): FlowPoint => {
  const last = document.nodes
    .filter((node) => isTriggerNode(node))
    .reduce<FlowDocument['nodes'][number] | null>(
      (current, node) =>
        current === null || node.position.x > current.position.x ? node : current,
      null,
    );
  return last === null
    ? FIRST_STEP_POSITION
    : { x: last.position.x + NEW_TRIGGER_GAP, y: last.position.y };
};

export const firstTriggerAnchor = (document: FlowDocument): StepAnchor | null => {
  const trigger = document.nodes.find((node) => isTriggerNode(node));
  const port = trigger === undefined ? undefined : nodePorts(trigger)[0];
  return trigger === undefined || port === undefined
    ? null
    : { source: trigger.id, sourcePort: port };
};
