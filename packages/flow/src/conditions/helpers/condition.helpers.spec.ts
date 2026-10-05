import { describe, expect, it } from 'vitest';
import { ConditionOperator, RuleMatch } from '@flow/conditions/constants/condition.constants';
import {
  evaluateCondition,
  operatorsForType,
  pickRoute,
} from '@flow/conditions/helpers/condition.helpers';
import { PortName } from '@flow/document/constants/flow.constants';
import type { ConditionValue, RouterRule } from '@flow/document/typedefs/flow.typedefs';
import { VariableType } from '@flow/scope/constants/scope.constants';

const check = (operator: ConditionOperator, value: unknown, expected: ConditionValue = null) =>
  evaluateCondition({ variable: 'x', operator, value: expected }, value);

describe('evaluateCondition', () => {
  describe('string', () => {
    it.each([
      [ConditionOperator.Eq, 'refund', 'refund', true],
      [ConditionOperator.Eq, 'refund', 'Refund', false],
      [ConditionOperator.Neq, 'refund', 'booking', true],
      [ConditionOperator.Neq, 'refund', 'refund', false],
      [ConditionOperator.Contains, 'I want a refund', 'refund', true],
      [ConditionOperator.Contains, 'hello', 'refund', false],
      [ConditionOperator.NotContains, 'hello', 'refund', true],
      [ConditionOperator.NotContains, 'a refund', 'refund', false],
      [ConditionOperator.StartsWith, '/start now', '/start', true],
      [ConditionOperator.StartsWith, 'now /start', '/start', false],
      [ConditionOperator.IsEmpty, '', null, true],
      [ConditionOperator.IsEmpty, 'x', null, false],
      [ConditionOperator.IsNotEmpty, 'x', null, true],
      [ConditionOperator.IsNotEmpty, '', null, false],
    ] as const)('%s on %j and %j is %s', (operator, value, expected, result) => {
      expect(check(operator, value, expected)).toBe(result);
    });
  });

  describe('number', () => {
    it.each([
      [ConditionOperator.Eq, 7, 7, true],
      [ConditionOperator.Neq, 7, 7, false],
      [ConditionOperator.Gt, 8, 7, true],
      [ConditionOperator.Gt, 7, 7, false],
      [ConditionOperator.Gte, 7, 7, true],
      [ConditionOperator.Lt, 6, 7, true],
      [ConditionOperator.Lt, 7, 7, false],
      [ConditionOperator.Lte, 7, 7, true],
      [ConditionOperator.Gt, '8', 7, false],
    ] as const)('%s on %j and %j is %s', (operator, value, expected, result) => {
      expect(check(operator, value, expected)).toBe(result);
    });
  });

  describe('boolean', () => {
    it.each([
      [ConditionOperator.IsTrue, true, true],
      [ConditionOperator.IsTrue, false, false],
      [ConditionOperator.IsTrue, 'true', false],
      [ConditionOperator.IsFalse, false, true],
      [ConditionOperator.IsFalse, true, false],
    ] as const)('%s on %j is %s', (operator, value, result) => {
      expect(check(operator, value)).toBe(result);
    });
  });

  describe('enum', () => {
    it.each([
      [ConditionOperator.Eq, 'booking', 'booking', true],
      [ConditionOperator.Neq, 'booking', 'pricing', true],
      [ConditionOperator.In, 'booking', ['booking', 'pricing'], true],
      [ConditionOperator.In, 'other', ['booking', 'pricing'], false],
    ] as const)('%s on %j and %j is %s', (operator, value, expected, result) => {
      expect(check(operator, value, typeof expected === 'string' ? expected : [...expected])).toBe(
        result,
      );
    });
  });

  describe('string list', () => {
    it.each([
      [ConditionOperator.Contains, ['a', 'b'], 'b', true],
      [ConditionOperator.Contains, ['a', 'b'], 'c', false],
      [ConditionOperator.IsEmpty, [], null, true],
      [ConditionOperator.IsEmpty, ['a'], null, false],
      [ConditionOperator.IsNotEmpty, ['a'], null, true],
      [ConditionOperator.IsNotEmpty, [], null, false],
    ] as const)('%s on %j and %j is %s', (operator, value, expected, result) => {
      expect(check(operator, [...value], expected)).toBe(result);
    });
  });

  it('fails every operator on a missing value except is_empty', () => {
    for (const operator of Object.values(ConditionOperator)) {
      const expected = operator === ConditionOperator.In ? ['a'] : 'a';
      expect(check(operator, null, expected)).toBe(operator === ConditionOperator.IsEmpty);
      expect(check(operator, undefined, expected)).toBe(operator === ConditionOperator.IsEmpty);
    }
  });
});

describe('pickRoute', () => {
  const rules: RouterRule[] = [
    {
      id: 'human',
      label: 'Human',
      match: RuleMatch.Any,
      conditions: [
        { variable: 'guard.needs_human', operator: ConditionOperator.IsTrue, value: null },
        { variable: 'guard.score', operator: ConditionOperator.Lt, value: 3 },
      ],
    },
    {
      id: 'booking',
      label: 'Booking',
      match: RuleMatch.All,
      conditions: [
        { variable: 'topic.name', operator: ConditionOperator.Eq, value: 'booking' },
        { variable: 'guard.score', operator: ConditionOperator.Gte, value: 3 },
      ],
    },
  ];

  const resolverOf =
    (values: Record<string, unknown>) =>
    (path: string): unknown =>
      values[path];

  it('takes the first matching rule', () => {
    expect(
      pickRoute(
        rules,
        resolverOf({ 'guard.needs_human': true, 'guard.score': 9, 'topic.name': 'booking' }),
      ),
    ).toBe('human');
  });

  it('needs every condition of an all rule', () => {
    expect(pickRoute(rules, resolverOf({ 'guard.score': 5, 'topic.name': 'booking' }))).toBe(
      'booking',
    );
    expect(pickRoute(rules, resolverOf({ 'guard.score': 5, 'topic.name': 'pricing' }))).toBe(
      PortName.Else,
    );
  });

  it('needs one condition of an any rule', () => {
    expect(pickRoute(rules, resolverOf({ 'guard.score': 1 }))).toBe('human');
  });

  it('never matches a rule without conditions', () => {
    const empty: RouterRule = { id: 'empty', label: 'Empty', match: RuleMatch.Any, conditions: [] };
    expect(pickRoute([empty], resolverOf({}))).toBe(PortName.Else);
  });
});

describe('operatorsForType', () => {
  it('follows the operator table', () => {
    expect(operatorsForType(VariableType.Boolean)).toEqual([
      ConditionOperator.IsTrue,
      ConditionOperator.IsFalse,
    ]);
    expect(operatorsForType(VariableType.Enum)).toEqual([
      ConditionOperator.Eq,
      ConditionOperator.Neq,
      ConditionOperator.In,
    ]);
    expect(operatorsForType(VariableType.StringList)).toEqual([
      ConditionOperator.Contains,
      ConditionOperator.IsEmpty,
      ConditionOperator.IsNotEmpty,
    ]);
    expect(operatorsForType(VariableType.Number)).not.toContain(ConditionOperator.Contains);
    expect(operatorsForType(VariableType.String)).toContain(ConditionOperator.StartsWith);
  });

  it('allows every operator on an untyped value', () => {
    expect(operatorsForType(VariableType.Unknown)).toEqual(Object.values(ConditionOperator));
  });
});
