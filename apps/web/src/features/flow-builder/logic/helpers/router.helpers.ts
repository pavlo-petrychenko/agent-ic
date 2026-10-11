import {
  ConditionOperator,
  NodeType,
  OPERATOR_OPERANDS,
  OperandKind,
  RuleMatch,
  VariableType,
  operatorsForType,
  resolveVariable,
} from '@agent-ic/flow';
import type {
  Condition,
  ConditionValue,
  FlowDocument,
  RouterRule,
  VisibleVariable,
} from '@agent-ic/flow';
import {
  LIST_VALUE_JOINER,
  LIST_VALUE_SEPARATOR,
  INPUT_DEFAULTS,
  OPERAND_INPUTS,
  ValueInput,
} from '@/features/flow-builder/constants/inspector.constants';
import { updateNode } from '@/features/flow-builder/logic/helpers/inspector.helpers';
import type {
  ConditionPatch,
  ConditionView,
} from '@/features/flow-builder/typedefs/inspector.typedefs';

const variableType = (variables: readonly VisibleVariable[], path: string): VariableType =>
  resolveVariable(variables, path)?.type ?? VariableType.Unknown;

export const conditionView = (
  condition: Condition,
  variables: readonly VisibleVariable[],
): ConditionView => {
  const resolved = resolveVariable(variables, condition.variable);
  const type = resolved?.type ?? VariableType.Unknown;
  const values = resolved?.values ?? null;
  const operand = OPERATOR_OPERANDS[condition.operator];
  let input = OPERAND_INPUTS[operand];
  if (operand === OperandKind.Scalar && values !== null) {
    input = ValueInput.Choice;
  } else if (operand === OperandKind.Scalar && type === VariableType.Number) {
    input = ValueInput.Number;
  }
  return {
    condition,
    operators: operatorsForType(type),
    input,
    values,
    text: formatConditionValue(condition.value),
  };
};

const valueDefault = (
  condition: Condition,
  variables: readonly VisibleVariable[],
): ConditionValue => {
  const { input, values } = conditionView(condition, variables);
  return input === ValueInput.Choice ? (values?.[0] ?? '') : INPUT_DEFAULTS[input];
};

export const newCondition = (variables: readonly VisibleVariable[]): Condition => {
  const variable = variables[0]?.path ?? '';
  const operator = operatorsForType(variableType(variables, variable))[0] ?? ConditionOperator.Eq;
  const condition = { variable, operator, value: null };
  return { ...condition, value: valueDefault(condition, variables) };
};

export const patchCondition = (
  condition: Condition,
  { text, ...patch }: ConditionPatch,
  variables: readonly VisibleVariable[],
): Condition => {
  const next = { ...condition, ...patch };
  const allowed = operatorsForType(variableType(variables, next.variable));
  const operator = allowed.includes(next.operator) ? next.operator : (allowed[0] ?? next.operator);
  const result = { ...next, operator };
  if (text !== undefined) {
    return { ...result, value: parseConditionValue(conditionView(result, variables).input, text) };
  }
  const kindChanged = OPERATOR_OPERANDS[operator] !== OPERATOR_OPERANDS[condition.operator];
  const typeChanged = next.variable !== condition.variable;
  return kindChanged || typeChanged
    ? { ...result, value: valueDefault(result, variables) }
    : result;
};

export const parseConditionValue = (input: ValueInput, text: string): ConditionValue => {
  if (input === ValueInput.List) {
    return text
      .split(LIST_VALUE_SEPARATOR)
      .map((item) => item.trim())
      .filter((item) => item !== '');
  }
  const number = Number(text);
  return input === ValueInput.Number && text.trim() !== '' && !Number.isNaN(number) ? number : text;
};

export const formatConditionValue = (value: ConditionValue): string => {
  if (value === null) {
    return '';
  }
  return Array.isArray(value) ? value.join(LIST_VALUE_JOINER) : String(value);
};

const withRules = (
  document: FlowDocument,
  nodeId: string,
  change: (rules: readonly RouterRule[]) => RouterRule[],
): FlowDocument =>
  updateNode(document, nodeId, (node) =>
    node.type === NodeType.Router
      ? { ...node, config: { ...node.config, rules: change(node.config.rules) } }
      : node,
  );

const withRule = (
  document: FlowDocument,
  nodeId: string,
  ruleId: string,
  change: (rule: RouterRule) => RouterRule,
): FlowDocument =>
  withRules(document, nodeId, (rules) =>
    rules.map((rule) => (rule.id === ruleId ? change(rule) : rule)),
  );

export const addRule = (
  document: FlowDocument,
  nodeId: string,
  ruleId: string,
  variables: readonly VisibleVariable[],
): FlowDocument =>
  withRules(document, nodeId, (rules) => [
    ...rules,
    { id: ruleId, label: '', match: RuleMatch.All, conditions: [newCondition(variables)] },
  ]);

export const removeRule = (
  document: FlowDocument,
  nodeId: string,
  ruleId: string,
): FlowDocument => {
  const next = withRules(document, nodeId, (rules) => rules.filter((rule) => rule.id !== ruleId));
  return {
    ...next,
    edges: next.edges.filter((edge) => edge.source !== nodeId || edge.sourcePort !== ruleId),
  };
};

export const moveRule = (
  document: FlowDocument,
  nodeId: string,
  ruleId: string,
  offset: number,
): FlowDocument =>
  withRules(document, nodeId, (rules) => {
    const from = rules.findIndex((rule) => rule.id === ruleId);
    const to = from + offset;
    if (from < 0 || to < 0 || to >= rules.length) {
      return [...rules];
    }
    const next = [...rules];
    next.splice(to, 0, ...next.splice(from, 1));
    return next;
  });

export const renameRule = (
  document: FlowDocument,
  nodeId: string,
  ruleId: string,
  label: string,
): FlowDocument => withRule(document, nodeId, ruleId, (rule) => ({ ...rule, label }));

export const updateCondition = (
  document: FlowDocument,
  nodeId: string,
  ruleId: string,
  index: number,
  patch: ConditionPatch,
  variables: readonly VisibleVariable[],
): FlowDocument =>
  withRule(document, nodeId, ruleId, (rule) => ({
    ...rule,
    conditions: rule.conditions.map((condition, position) =>
      position === index ? patchCondition(condition, patch, variables) : condition,
    ),
  }));
