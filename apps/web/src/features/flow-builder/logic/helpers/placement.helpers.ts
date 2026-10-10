import { isTriggerNode, nodePorts } from '@agent-ic/flow';
import type { FlowDocument } from '@agent-ic/flow';
import { FIRST_STEP_POSITION } from '@/features/flow-builder/constants/flowBuilder.constants';
import { NEW_STEP_GAP } from '@/features/flow-builder/constants/palette.constants';
import { connect } from '@/features/flow-builder/logic/helpers/connection.helpers';
import { addNode, removeElements } from '@/features/flow-builder/logic/helpers/graphEdit.helpers';
import type { FlowPoint } from '@/features/flow-builder/typedefs/flowBuilder.typedefs';
import type { StepAnchor, StepPlacement } from '@/features/flow-builder/typedefs/palette.typedefs';

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

export const placeStep = (
  document: FlowDocument,
  placement: StepPlacement,
  createId: () => string,
): FlowDocument => {
  const nodeId = createId();
  const added = addNode(document, placement.type, placement.position, nodeId);
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

export const firstTriggerAnchor = (document: FlowDocument): StepAnchor | null => {
  const trigger = document.nodes.find((node) => isTriggerNode(node));
  const port = trigger === undefined ? undefined : nodePorts(trigger)[0];
  return trigger === undefined || port === undefined
    ? null
    : { source: trigger.id, sourcePort: port };
};
