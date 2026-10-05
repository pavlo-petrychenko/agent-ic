import {
  ConditionOperator,
  OperandKind,
  OPERATOR_OPERANDS,
  OPERATORS_BY_TYPE,
  RuleMatch,
} from '@flow/conditions/constants/condition.constants';
import { PortName } from '@flow/document/constants/flow.constants';
import type { Condition, ConditionValue, RouterRule } from '@flow/document/typedefs/flow.typedefs';
import { VariableType } from '@flow/scope/constants/scope.constants';
import type { ResolvedVariable } from '@flow/scope/typedefs/scope.typedefs';
import type { VariableResolver } from '@flow/templates/typedefs/template.typedefs';

const isMissing = (value: unknown): value is null | undefined =>
  value === null || value === undefined;

const isEmpty = (value: unknown): boolean =>
  isMissing(value) || value === '' || (Array.isArray(value) && value.length === 0);

const contains = (value: unknown, expected: ConditionValue): boolean => {
  if (typeof value === 'string' && typeof expected === 'string') {
    return value.includes(expected);
  }
  if (Array.isArray(value)) {
    return value.includes(expected);
  }
  return false;
};

const compareNumbers = (
  value: unknown,
  expected: ConditionValue,
  compare: (left: number, right: number) => boolean,
): boolean => typeof value === 'number' && typeof expected === 'number' && compare(value, expected);

const isScalar = (value: unknown): boolean =>
  typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';

export const evaluateCondition = (condition: Condition, value: unknown): boolean => {
  const expected = condition.value;
  if (condition.operator === ConditionOperator.IsEmpty) {
    return isEmpty(value);
  }
  if (isMissing(value)) {
    return false;
  }
  switch (condition.operator) {
    case ConditionOperator.Eq:
      return isScalar(value) && value === expected;
    case ConditionOperator.Neq:
      return isScalar(value) && value !== expected;
    case ConditionOperator.Contains:
      return contains(value, expected);
    case ConditionOperator.NotContains:
      return (typeof value === 'string' || Array.isArray(value)) && !contains(value, expected);
    case ConditionOperator.StartsWith:
      return (
        typeof value === 'string' && typeof expected === 'string' && value.startsWith(expected)
      );
    case ConditionOperator.IsNotEmpty:
      return !isEmpty(value);
    case ConditionOperator.Gt:
      return compareNumbers(value, expected, (left, right) => left > right);
    case ConditionOperator.Gte:
      return compareNumbers(value, expected, (left, right) => left >= right);
    case ConditionOperator.Lt:
      return compareNumbers(value, expected, (left, right) => left < right);
    case ConditionOperator.Lte:
      return compareNumbers(value, expected, (left, right) => left <= right);
    case ConditionOperator.IsTrue:
      return value === true;
    case ConditionOperator.IsFalse:
      return value === false;
    case ConditionOperator.In:
      return typeof value === 'string' && Array.isArray(expected) && expected.includes(value);
  }
};

const ruleMatches = (rule: RouterRule, resolve: VariableResolver): boolean => {
  if (rule.conditions.length === 0) {
    return false;
  }
  const results = rule.conditions.map((condition) =>
    evaluateCondition(condition, resolve(condition.variable)),
  );
  return rule.match === RuleMatch.All ? results.every(Boolean) : results.some(Boolean);
};

export const pickRoute = (rules: readonly RouterRule[], resolve: VariableResolver): string =>
  rules.find((rule) => ruleMatches(rule, resolve))?.id ?? PortName.Else;

export const operatorsForType = (type: VariableType): readonly ConditionOperator[] =>
  OPERATORS_BY_TYPE[type];

const allowedValue = (variable: ResolvedVariable, value: string): boolean =>
  variable.values === null || variable.values.includes(value);

const scalarFits = (variable: ResolvedVariable, value: ConditionValue): boolean => {
  switch (variable.type) {
    case VariableType.Number:
      return typeof value === 'number';
    case VariableType.Enum:
      return typeof value === 'string' && allowedValue(variable, value);
    case VariableType.Unknown:
      return isScalar(value);
    case VariableType.String:
    case VariableType.Boolean:
    case VariableType.StringList:
    case VariableType.List:
      return typeof value === 'string';
  }
};

export const conditionValueFits = (
  operator: ConditionOperator,
  variable: ResolvedVariable,
  value: ConditionValue,
): boolean => {
  switch (OPERATOR_OPERANDS[operator]) {
    case OperandKind.None:
      return value === null;
    case OperandKind.Scalar:
      return scalarFits(variable, value);
    case OperandKind.Text:
      return typeof value === 'string';
    case OperandKind.Number:
      return typeof value === 'number';
    case OperandKind.TextList:
      return (
        Array.isArray(value) &&
        value.length > 0 &&
        value.every((item) => allowedValue(variable, item))
      );
  }
};
