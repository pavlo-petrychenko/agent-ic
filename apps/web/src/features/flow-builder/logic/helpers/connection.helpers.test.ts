import { NodeType, PortName } from '@agent-ic/flow';
import { describe, expect, it } from 'vitest';
import { EMPTY_FLOW } from '@/features/flow-builder/constants/flowBuilder.constants';
import { canConnect, connect } from '@/features/flow-builder/logic/helpers/connection.helpers';
import { addNode } from '@/features/flow-builder/logic/helpers/graphEdit.helpers';
import type { AddableNodeType } from '@/features/flow-builder/typedefs/graphEdit.typedefs';

const ORIGIN = { x: 0, y: 0 };
const STEPS: Readonly<Record<string, AddableNodeType>> = {
  t: NodeType.TriggerMessage,
  a: NodeType.Agent,
  s: NodeType.SendMessage,
  x: NodeType.Escalation,
  p: NodeType.Parallel,
};
const document = Object.entries(STEPS).reduce(
  (current, [id, type]) => addNode(current, type, ORIGIN, id),
  EMPTY_FLOW,
);

describe('canConnect', () => {
  it('allows a step with ports into a later step', () => {
    expect(canConnect(document, 't', 'a')).toBe(true);
  });

  it.each([
    ['into a trigger', 'a', 't'],
    ['into itself', 'a', 'a'],
    ['out of a step without ports', 'x', 'a'],
    ['to an unknown step', 'a', 'missing'],
  ])('refuses a connection %s', (_, source, target) => {
    expect(canConnect(document, source, target)).toBe(false);
  });

  it('refuses a connection that closes a loop', () => {
    const linked = connect(document, { source: 'a', sourcePort: PortName.Next, target: 's' }, 'e1');

    expect(canConnect(linked, 's', 'a')).toBe(false);
  });
});

describe('connect', () => {
  it('replaces the connection a port already had', () => {
    const first = connect(document, { source: 'a', sourcePort: PortName.Next, target: 's' }, 'e1');
    const second = connect(first, { source: 'a', sourcePort: PortName.Next, target: 'x' }, 'e2');

    expect(second.edges).toEqual([
      { id: 'e2', source: 'a', sourcePort: PortName.Next, target: 'x' },
    ]);
  });

  it('keeps every branch of a parallel step', () => {
    const first = connect(
      document,
      { source: 'p', sourcePort: PortName.Branches, target: 'a' },
      'e1',
    );
    const second = connect(
      first,
      { source: 'p', sourcePort: PortName.Branches, target: 's' },
      'e2',
    );

    expect(second.edges.map((edge) => edge.id)).toEqual(['e1', 'e2']);
  });

  it('ignores a port the step does not have', () => {
    expect(connect(document, { source: 's', sourcePort: PortName.Error, target: 'x' }, 'e1')).toBe(
      document,
    );
  });
});
