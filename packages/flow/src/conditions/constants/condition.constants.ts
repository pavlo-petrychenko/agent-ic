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

export enum OperandKind {
  None = 'none',
  Scalar = 'scalar',
  Text = 'text',
  Number = 'number',
  TextList = 'text_list',
}

export const OPERATOR_OPERANDS: Readonly<Record<ConditionOperator, OperandKind>> = {
  [ConditionOperator.Eq]: OperandKind.Scalar,
  [ConditionOperator.Neq]: OperandKind.Scalar,
  [ConditionOperator.Contains]: OperandKind.Text,
  [ConditionOperator.NotContains]: OperandKind.Text,
  [ConditionOperator.StartsWith]: OperandKind.Text,
  [ConditionOperator.IsEmpty]: OperandKind.None,
  [ConditionOperator.IsNotEmpty]: OperandKind.None,
  [ConditionOperator.Gt]: OperandKind.Number,
  [ConditionOperator.Gte]: OperandKind.Number,
  [ConditionOperator.Lt]: OperandKind.Number,
  [ConditionOperator.Lte]: OperandKind.Number,
  [ConditionOperator.IsTrue]: OperandKind.None,
  [ConditionOperator.IsFalse]: OperandKind.None,
  [ConditionOperator.In]: OperandKind.TextList,
};
