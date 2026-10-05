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
