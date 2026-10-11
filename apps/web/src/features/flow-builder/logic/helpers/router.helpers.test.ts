import {
  ConditionOperator,
  NodeType,
  RuleMatch,
  VariableSourceKind,
  VariableType,
} from '@agent-ic/flow';
import type { FlowDocument, VisibleVariable } from '@agent-ic/flow';
import { describe, expect, it } from 'vitest';
import { EMPTY_FLOW } from '@/features/flow-builder/constants/flowBuilder.constants';
import { ValueInput } from '@/features/flow-builder/constants/inspector.constants';
import { addNode } from '@/features/flow-builder/logic/helpers/graphEdit.helpers';
import {
  addRule,
  conditionView,
  formatConditionValue,
  moveRule,
  parseConditionValue,
  patchCondition,
  removeRule,
  renameRule,
  updateCondition,
} from '@/features/flow-builder/logic/helpers/router.helpers';

const variable = (
  path: string,
  type: VariableType,
  values: readonly string[] | null = null,
): VisibleVariable => ({
  path,
  type,
  values,
  nullable: false,
  open: false,
  source: VariableSourceKind.Step,
  nodeId: null,
});
const VARIABLES = [
  variable('message.text', VariableType.String),
  variable('guard.score', VariableType.Number),
  variable('guard.level', VariableType.Enum, ['low', 'high']),
];
const TEXT = { variable: 'message.text', operator: ConditionOperator.Contains, value: 'hi' };

const withRules = (...ids: string[]): FlowDocument =>
  ids.reduce(
    (document, id) => addRule(document, 'r', id, VARIABLES),
    addNode(EMPTY_FLOW, NodeType.Router, { x: 0, y: 0 }, 'r'),
  );
const rules = (document: FlowDocument) => {
  const [router] = document.nodes;
  return router?.type === NodeType.Router ? router.config.rules : [];
};

describe('router rule edits', () => {
  it('adds a rule with a condition on the first field', () => {
    expect(rules(withRules('a'))).toEqual([
      {
        id: 'a',
        label: '',
        match: RuleMatch.All,
        conditions: [{ variable: 'message.text', operator: ConditionOperator.Eq, value: '' }],
      },
    ]);
  });

  it('moves, renames and removes rules with their connections', () => {
    const linked = {
      ...withRules('a', 'b'),
      edges: [{ id: 'e', source: 'r', sourcePort: 'a', target: 'x' }],
    };

    expect(rules(moveRule(linked, 'r', 'b', -1)).map((rule) => rule.id)).toEqual(['b', 'a']);
    expect(rules(moveRule(linked, 'r', 'a', -1)).map((rule) => rule.id)).toEqual(['a', 'b']);
    expect(rules(renameRule(linked, 'r', 'a', 'Refunds'))[0]?.label).toBe('Refunds');
    expect(removeRule(linked, 'r', 'a')).toMatchObject({ edges: [] });
    expect(rules(removeRule(linked, 'r', 'a')).map((rule) => rule.id)).toEqual(['b']);
  });

  it('updates one condition', () => {
    const changed = updateCondition(withRules('a'), 'r', 'a', 0, { text: 'refund' }, VARIABLES);

    expect(rules(changed)[0]?.conditions[0]?.value).toBe('refund');
  });
});

describe('patchCondition', () => {
  it('keeps the value while the operand stays the same', () => {
    expect(
      patchCondition(TEXT, { operator: ConditionOperator.StartsWith }, VARIABLES),
    ).toMatchObject({ value: 'hi' });
  });

  it('picks an operator of the new field type and resets the value', () => {
    expect(patchCondition(TEXT, { variable: 'guard.score' }, VARIABLES)).toEqual({
      variable: 'guard.score',
      operator: ConditionOperator.Eq,
      value: 0,
    });
    expect(patchCondition(TEXT, { operator: ConditionOperator.IsEmpty }, VARIABLES)).toMatchObject({
      value: null,
    });
  });
});

describe('conditionView', () => {
  it.each([
    [TEXT, ValueInput.Text],
    [{ ...TEXT, operator: ConditionOperator.IsEmpty }, ValueInput.None],
    [{ variable: 'guard.score', operator: ConditionOperator.Eq, value: 1 }, ValueInput.Number],
    [{ variable: 'guard.level', operator: ConditionOperator.Eq, value: 'low' }, ValueInput.Choice],
    [{ variable: 'guard.level', operator: ConditionOperator.In, value: [] }, ValueInput.List],
  ])('picks the value input for %j', (condition, input) => {
    expect(conditionView(condition, VARIABLES).input).toBe(input);
  });
});

describe('condition values', () => {
  it.each([
    [ValueInput.Number, '12', 12],
    [ValueInput.Number, 'twelve', 'twelve'],
    [ValueInput.List, 'low, high,', ['low', 'high']],
    [ValueInput.Text, '12', '12'],
  ])('parses %s input %j', (input, text, value) => {
    expect(parseConditionValue(input, text)).toEqual(value);
  });

  it.each([
    [null, ''],
    [['low', 'high'], 'low, high'],
    [3, '3'],
  ])('formats %j', (value, text) => {
    expect(formatConditionValue(value)).toBe(text);
  });
});
