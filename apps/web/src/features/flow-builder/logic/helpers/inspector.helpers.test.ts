import { CompletionRole, NodeType, PortName, VariableType, WaitFor } from '@agent-ic/flow';
import type { FlowDocument } from '@agent-ic/flow';
import { describe, expect, it } from 'vitest';
import { EMPTY_FLOW } from '@/features/flow-builder/constants/flowBuilder.constants';
import { BranchRole, FieldHint } from '@/features/flow-builder/constants/inspector.constants';
import { addNode } from '@/features/flow-builder/logic/helpers/graphEdit.helpers';
import {
  branchRows,
  fieldRows,
  nodeKeyFromLabel,
  proposeKeyRename,
  updateNode,
} from '@/features/flow-builder/logic/helpers/inspector.helpers';

const ORIGIN = { x: 0, y: 0 };
const flow = addNode(
  addNode(EMPTY_FLOW, NodeType.Router, ORIGIN, 'a'),
  NodeType.Router,
  ORIGIN,
  'b',
);

describe('nodeKeyFromLabel', () => {
  it.each([
    ['Needs a person?', 'needs_a_person'],
    ['Потрібна людина', null],
    ['2nd step', null],
    ['Message', null],
  ])('turns %j into %j', (label, key) => {
    expect(nodeKeyFromLabel(label)).toBe(key);
  });
});

describe('proposeKeyRename', () => {
  it('proposes a free key made from the label', () => {
    expect(proposeKeyRename(flow, 'a', 'Refund check')).toEqual({
      nodeId: 'a',
      from: 'router',
      to: 'refund_check',
    });
  });

  it('adds a suffix when another step has the key', () => {
    expect(proposeKeyRename(flow, 'a', 'Router 2')?.to).toBe('router_3');
  });

  it('proposes nothing when the key would not change', () => {
    expect(proposeKeyRename(flow, 'a', 'Router')).toBeNull();
  });
});

describe('fieldRows', () => {
  it('adds the hint for known fields', () => {
    const [row] = fieldRows([{ path: 'user.name', type: VariableType.String, values: null }]);
    expect(row?.hint).toBe(FieldHint.FromChannel);
  });
});

describe('parallel branches', () => {
  const observed: FlowDocument = {
    ...updateNode(
      addNode(
        addNode(EMPTY_FLOW, NodeType.Parallel, ORIGIN, 'p'),
        NodeType.Completion,
        ORIGIN,
        'o',
      ),
      'o',
      (node) =>
        node.type === NodeType.Completion
          ? { ...node, label: 'Tagger', config: { ...node.config, role: CompletionRole.Observer } }
          : node,
    ),
    edges: [{ id: 'e', source: 'p', sourcePort: PortName.Branches, target: 'o' }],
  };
  const branches = (waitFor: WaitFor) => {
    const [parallel] = observed.nodes;
    return parallel?.type === NodeType.Parallel
      ? branchRows(observed, { ...parallel, config: { waitFor } }, PortName.Branches)
      : [];
  };

  it.each([
    [WaitFor.Guards, BranchRole.Observer],
    [WaitFor.All, BranchRole.Waited],
    [WaitFor.First, BranchRole.Racing],
  ])('marks an observer branch for %s', (waitFor, role) => {
    expect(branches(waitFor)).toMatchObject([{ nodeId: 'o', label: 'Tagger', role }]);
  });
});
