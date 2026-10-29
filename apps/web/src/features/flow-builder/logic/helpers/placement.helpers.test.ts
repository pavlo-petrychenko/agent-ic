import { AgentExitKind, NO_AGENT_EXITS, NodeType, PortName } from '@agent-ic/flow';
import type { FlowDocument } from '@agent-ic/flow';
import { describe, expect, it } from 'vitest';
import { EMPTY_FLOW } from '@/features/flow-builder/constants/flowBuilder.constants';
import { paletteAgentExits } from '@/features/flow-builder/logic/helpers/agentExit.helpers';
import { addNode } from '@/features/flow-builder/logic/helpers/graphEdit.helpers';
import {
  belowLowestNode,
  clearOfNodes,
  firstTriggerAnchor,
  placeStep,
} from '@/features/flow-builder/logic/helpers/placement.helpers';
import type { StepPlacement } from '@/features/flow-builder/typedefs/palette.typedefs';

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
      {
        type: NodeType.Agent,
        label: 'Agent',
        position: { x: 5, y: 6 },
        after: null,
        splitEdgeId: null,
        agentExits: NO_AGENT_EXITS,
      },
      ids(),
    );

    expect(placed.nodes).toMatchObject([
      { id: 'id1', type: NodeType.Agent, position: { x: 5, y: 6 } },
    ]);
    expect(placed.edges).toEqual([]);
  });

  it('gives a new agent the exits of the placement and leaves other steps alone', () => {
    const exits = paletteAgentExits('the customer asks for a person');
    const placement: StepPlacement = {
      type: NodeType.Agent,
      label: 'Agent',
      position: { x: 0, y: 0 },
      after: null,
      splitEdgeId: null,
      agentExits: exits,
    };
    const placed = placeStep(
      placeStep(EMPTY_FLOW, placement, ids()),
      { ...placement, type: NodeType.Completion, label: 'Completion' },
      () => 'id9',
    );

    expect(placed.nodes[0]).toMatchObject({
      config: {
        exits: {
          [AgentExitKind.End]: null,
          [AgentExitKind.Handoff]: { when: 'the customer asks for a person' },
        },
      },
    });
    expect(placed.nodes[1]?.config).not.toHaveProperty('exits');
  });

  it('titles each new step by its type and keeps the keys unique', () => {
    const placement: StepPlacement = {
      type: NodeType.Agent,
      label: 'Agent',
      position: { x: 0, y: 0 },
      after: null,
      splitEdgeId: null,
      agentExits: NO_AGENT_EXITS,
    };
    const createId = ids();
    const twice = placeStep(placeStep(EMPTY_FLOW, placement, createId), placement, createId);

    expect(twice.nodes.map((node) => [node.key, node.label])).toEqual([
      ['agent', 'Agent'],
      ['agent_2', 'Agent'],
    ]);
  });

  it('connects the new step after an anchor', () => {
    const placed = placeStep(
      triggerAndReply(),
      {
        type: NodeType.Agent,
        label: 'Agent',
        position: { x: 0, y: 150 },
        after: { source: 's', sourcePort: PortName.Next },
        splitEdgeId: null,
        agentExits: NO_AGENT_EXITS,
      },
      ids(),
    );

    expect(links(placed)).toEqual(['t.next>s', 's.next>id1']);
  });

  it('splits an edge around the dropped step', () => {
    const placed = placeStep(
      triggerAndReply(),
      {
        type: NodeType.Agent,
        label: 'Agent',
        position: { x: 0, y: 150 },
        after: null,
        splitEdgeId: 'e',
        agentExits: NO_AGENT_EXITS,
      },
      ids(),
    );

    expect(links(placed)).toEqual(['t.next>id1', 'id1.next>s']);
  });

  it('keeps the edge when the dropped step cannot sit inside it', () => {
    const placed = placeStep(
      triggerAndReply(),
      {
        type: NodeType.Escalation,
        label: 'Escalation / exit',
        position: { x: 0, y: 150 },
        after: null,
        splitEdgeId: 'e',
        agentExits: NO_AGENT_EXITS,
      },
      ids(),
    );

    expect(links(placed)).toEqual(['t.next>s']);
    expect(placed.nodes).toHaveLength(3);
  });
});

describe('placing over existing steps', () => {
  const agent = (position: { x: number; y: number }): StepPlacement => ({
    type: NodeType.Agent,
    label: 'Agent',
    position,
    after: null,
    splitEdgeId: null,
  });

  it('moves a step dropped on the trigger below it', () => {
    const placed = placeStep(triggerAndReply(), agent({ x: 20, y: 10 }), ids());

    expect(placed.nodes.at(-1)?.position).toEqual({ x: 20, y: 120 });
  });

  it('keeps moving down past every step in the way', () => {
    const stacked = addNode(triggerAndReply(), NodeType.Agent, { x: 0, y: 120 }, 'a');

    expect(clearOfNodes(stacked, { x: 0, y: 0 })).toEqual({ x: 0, y: 420 });
  });

  it('leaves a free position and a position in another column alone', () => {
    expect(clearOfNodes(triggerAndReply(), { x: 0, y: 150 })).toEqual({ x: 0, y: 150 });
    expect(clearOfNodes(triggerAndReply(), { x: 300, y: 0 })).toEqual({ x: 300, y: 0 });
  });

  it('never lands a second palette step on the first', () => {
    const createId = ids();
    const first = placeStep(triggerAndReply(), agent(belowLowestNode(triggerAndReply())), createId);
    const second = placeStep(first, agent(belowLowestNode(first)), createId);
    const positions = second.nodes.map((node) => `${node.position.x},${node.position.y}`);

    expect(new Set(positions).size).toBe(positions.length);
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
