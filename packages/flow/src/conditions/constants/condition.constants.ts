import { VariableType } from '@flow/scope/constants/scope.constants';

export enum ConditionOperator {
  Eq = 'eq',
  Neq = 'neq',
  Contains = 'contains',
  NotContains = 'not_contains',
  StartsWith = 'starts_with',
  IsEmpty = 'is_empty',
  IsNotEmpty = 'is_not_empty',
  Gt = 'gt',
  Gte = 'gte',
  Lt = 'lt',
  Lte = 'lte',
  IsTrue = 'is_true',
  IsFalse = 'is_false',
  In = 'in',
}

export enum RuleMatch {
  All = 'all',
  Any = 'any',
}

export const OPERATORS_BY_TYPE: Readonly<Record<VariableType, readonly ConditionOperator[]>> = {
  [VariableType.String]: [
    ConditionOperator.Eq,
    ConditionOperator.Neq,
    ConditionOperator.Contains,
    ConditionOperator.NotContains,
    ConditionOperator.StartsWith,
    ConditionOperator.IsEmpty,
    ConditionOperator.IsNotEmpty,
  ],
  [VariableType.Number]: [
    ConditionOperator.Eq,
    ConditionOperator.Neq,
    ConditionOperator.Gt,
    ConditionOperator.Gte,
    ConditionOperator.Lt,
    ConditionOperator.Lte,
  ],
  [VariableType.Boolean]: [ConditionOperator.IsTrue, ConditionOperator.IsFalse],
  [VariableType.Enum]: [ConditionOperator.Eq, ConditionOperator.Neq, ConditionOperator.In],
  [VariableType.StringList]: [
    ConditionOperator.Contains,
    ConditionOperator.IsEmpty,
    ConditionOperator.IsNotEmpty,
  ],
  [VariableType.List]: [ConditionOperator.IsEmpty, ConditionOperator.IsNotEmpty],
  [VariableType.Unknown]: Object.values(ConditionOperator),
};
