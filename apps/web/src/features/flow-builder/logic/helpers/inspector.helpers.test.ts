import {
  FlowIssueCode,
  FlowIssueSeverity,
  NodeType,
  PortName,
  VariableType,
  WaitFor,
} from '@agent-ic/flow';
import type { FlowDocument } from '@agent-ic/flow';
import { describe, expect, it } from 'vitest';
import { EMPTY_FLOW } from '@/features/flow-builder/constants/flowBuilder.constants';
import {
  BranchRole,
  FieldHint,
  IssuePathSegment,
} from '@/features/flow-builder/constants/inspector.constants';
import { addNode } from '@/features/flow-builder/logic/helpers/graphEdit.helpers';
import {
  branchRows,
  conditionPath,
  fieldErrors,
  fieldRows,
  nodeKeyFromLabel,
  observerNames,
  proposeKeyRename,
  rulePath,
  updateNode,
} from '@/features/flow-builder/logic/helpers/inspector.helpers';
import type { AddableNodeType } from '@/features/flow-builder/typedefs/graphEdit.typedefs';

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

describe('fieldErrors', () => {
  it('keeps the first issue of the step per field path', () => {
    const issue = (nodeId: string, code: FlowIssueCode) => ({
      code,
      nodeId,
      severity: FlowIssueSeverity.Error,
      edgeId: null,
      path: ['rules', '0', 'conditions'],
      params: {},
    });
    const errors = fieldErrors(
      [
        issue('b', FlowIssueCode.Cycle),
        issue('a', FlowIssueCode.RuleWithoutConditions),
        issue('a', FlowIssueCode.Cycle),
      ],
      'a',
    );

    expect(errors.get(rulePath(0, IssuePathSegment.Conditions))?.code).toBe(
      FlowIssueCode.RuleWithoutConditions,
    );
  });

  it('builds the path of a condition field', () => {
    expect(conditionPath(1, 2, IssuePathSegment.Value)).toBe('rules.1.conditions.2.value');
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
      (node) => ({ ...node, label: 'Tagger' }),
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
    [WaitFor.All, BranchRole.Waited],
    [WaitFor.First, BranchRole.Racing],
  ])('marks a waited branch for %s', (waitFor, role) => {
    expect(branches(waitFor)).toMatchObject([{ nodeId: 'o', label: 'Tagger', role }]);
  });

  it.each([WaitFor.All, WaitFor.First])('marks a background branch for %s', (waitFor) => {
    const background = {
      ...observed,
      edges: observed.edges.map((edge) => ({ ...edge, background: true })),
    };
    const [parallel] = background.nodes;
    const rows =
      parallel?.type === NodeType.Parallel
        ? branchRows(background, { ...parallel, config: { waitFor } }, PortName.Branches)
        : [];
    expect(rows).toMatchObject([{ nodeId: 'o', role: BranchRole.Background }]);
  });

  it('names the steps of a background branch that runs in parallel with the router', () => {
    const document = addNode(
      addNode(EMPTY_FLOW, NodeType.Parallel, ORIGIN, 'p'),
      NodeType.Agent,
      ORIGIN,
      'scorer',
    );
    const linked = addNode(
      {
        ...updateNode(document, 'scorer', (node) => ({ ...node, label: 'Scorer' })),
        edges: [
          {
            id: 'b',
            source: 'p',
            sourcePort: PortName.Branches,
            target: 'scorer',
            background: true,
          },
          { id: 'n', source: 'p', sourcePort: PortName.Next, target: 'r' },
        ],
      },
      NodeType.Router,
      ORIGIN,
      'r',
    );
    expect(observerNames(linked, 'r')).toEqual(['Scorer']);
  });

  it('names only the background steps that run in parallel with the router', () => {
    const steps: [AddableNodeType, string][] = [
      [NodeType.Router, 'r'],
      [NodeType.Router, 'before'],
      [NodeType.Completion, 'elsewhere'],
    ];
    const document = steps.reduce(
      (current, [type, id]) => addNode(current, type, ORIGIN, id),
      observed,
    );
    const linked: FlowDocument = {
      ...updateNode(document, 'elsewhere', (node) => ({ ...node, label: 'Other' })),
      edges: [
        ...observed.edges.map((edge) => ({ ...edge, background: true })),
        { id: 'n', source: 'p', sourcePort: PortName.Next, target: 'r' },
        { id: 'b', source: 'before', sourcePort: 'x', target: 'p' },
      ],
    };

    expect(observerNames(linked, 'r')).toEqual(['Tagger']);
    expect(observerNames(linked, 'before')).toEqual([]);
  });
});
