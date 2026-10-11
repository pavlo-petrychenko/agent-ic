import { NodeType, PortName } from '@agent-ic/flow';
import type { FlowDocument } from '@agent-ic/flow';
import { describe, expect, it } from 'vitest';
import { EMPTY_FLOW } from '@/features/flow-builder/constants/flowBuilder.constants';
import { addNode } from '@/features/flow-builder/logic/helpers/graphEdit.helpers';
import {
  belowLowestNode,
  firstTriggerAnchor,
  placeStep,
} from '@/features/flow-builder/logic/helpers/placement.helpers';

const ids = () => {
  let next = 0;
  return () => {
    next += 1;
    return `id${next}`;
  };
};

const triggerAndReply = (): FlowDocument => {
  const document = addNode(
    addNode(EMPTY_FLOW, NodeType.TriggerMessage, { x: 0, y: 0 }, 't'),
    NodeType.SendMessage,
    { x: 0, y: 300 },
    's',
  );
  return { ...document, edges: [{ id: 'e', source: 't', sourcePort: PortName.Next, target: 's' }] };
};

const links = (document: FlowDocument) =>
  document.edges.map((edge) => `${edge.source}.${edge.sourcePort}>${edge.target}`);

describe('placeStep', () => {
  it('adds a step on its own', () => {
    const placed = placeStep(
      EMPTY_FLOW,
      { type: NodeType.Agent, position: { x: 5, y: 6 }, after: null, splitEdgeId: null },
      ids(),
    );

    expect(placed.nodes).toMatchObject([
      { id: 'id1', type: NodeType.Agent, position: { x: 5, y: 6 } },
    ]);
    expect(placed.edges).toEqual([]);
  });

  it('connects the new step after an anchor', () => {
    const placed = placeStep(
      triggerAndReply(),
      {
        type: NodeType.Agent,
        position: { x: 0, y: 150 },
        after: { source: 's', sourcePort: PortName.Next },
        splitEdgeId: null,
      },
      ids(),
    );

    expect(links(placed)).toEqual(['t.next>s', 's.next>id1']);
  });

  it('splits an edge around the dropped step', () => {
    const placed = placeStep(
      triggerAndReply(),
      { type: NodeType.Agent, position: { x: 0, y: 150 }, after: null, splitEdgeId: 'e' },
      ids(),
    );

    expect(links(placed)).toEqual(['t.next>id1', 'id1.next>s']);
  });

  it('keeps the edge when the dropped step cannot sit inside it', () => {
    const placed = placeStep(
      triggerAndReply(),
      { type: NodeType.Escalation, position: { x: 0, y: 150 }, after: null, splitEdgeId: 'e' },
      ids(),
    );

    expect(links(placed)).toEqual(['t.next>s']);
    expect(placed.nodes).toHaveLength(3);
  });
});

describe('belowLowestNode', () => {
  it('starts at the origin on an empty flow and goes below the lowest step otherwise', () => {
    expect(belowLowestNode(EMPTY_FLOW)).toEqual({ x: 0, y: 0 });
    expect(belowLowestNode(triggerAndReply())).toEqual({ x: 0, y: 420 });
  });
});

describe('firstTriggerAnchor', () => {
  it('anchors on the first trigger port, or nothing without a trigger', () => {
    expect(firstTriggerAnchor(triggerAndReply())).toEqual({
      source: 't',
      sourcePort: PortName.Next,
    });
    expect(firstTriggerAnchor(EMPTY_FLOW)).toBeNull();
  });
});
