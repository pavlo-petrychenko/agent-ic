import { conditionValueFits, operatorsForType } from '@flow/conditions/helpers/condition.helpers';
import { NodeType } from '@flow/document/constants/flow.constants';
import type { FlowNode, RouterNode, SendMessageNode } from '@flow/document/typedefs/flow.typedefs';
import { MessageContentKind, QuickRepliesKind } from '@flow/nodes/constants/step.constants';
import { VariableType } from '@flow/scope/constants/scope.constants';
import { resolveVariable } from '@flow/scope/helpers/scope.helpers';
import type { VisibleVariable } from '@flow/scope/typedefs/scope.typedefs';
import { NodeTextKind, TemplateSegmentKind } from '@flow/templates/constants/template.constants';
import { nodeTextFields } from '@flow/templates/helpers/node-text.helpers';
import { parseTemplate } from '@flow/templates/helpers/template.helpers';
import type { NodeTextField } from '@flow/templates/typedefs/template.typedefs';
import { FlowIssueCode } from '@flow/validation/constants/issue.constants';
import { createIssue } from '@flow/validation/helpers/issue.helpers';
import type { FlowIssue, ValidationContext } from '@flow/validation/typedefs/validation.typedefs';

const LIST_TYPES: readonly VariableType[] = [VariableType.StringList, VariableType.Unknown];

const templateIssues = (
  node: FlowNode,
  field: NodeTextField,
  variables: readonly VisibleVariable[],
): FlowIssue[] =>
  parseTemplate(field.value).flatMap((segment) => {
    if (segment.kind === TemplateSegmentKind.Invalid) {
      return [
        createIssue(FlowIssueCode.InvalidTemplate, {
          nodeId: node.id,
          path: field.path,
          params: { reason: segment.reason, start: segment.start, end: segment.end },
        }),
      ];
    }
    if (
      segment.kind === TemplateSegmentKind.Reference &&
      resolveVariable(variables, segment.path) === null
    ) {
      return [
        createIssue(FlowIssueCode.UnknownVariable, {
          nodeId: node.id,
          path: field.path,
          params: { variable: segment.path, start: segment.start, end: segment.end },
        }),
      ];
    }
    return [];
  });

const variableIssues = (
  node: FlowNode,
  field: NodeTextField,
  variables: readonly VisibleVariable[],
): FlowIssue[] =>
  resolveVariable(variables, field.value) === null
    ? [
        createIssue(FlowIssueCode.UnknownVariable, {
          nodeId: node.id,
          path: field.path,
          params: { variable: field.value.trim() },
        }),
      ]
    : [];

const conditionIssues = (node: RouterNode, variables: readonly VisibleVariable[]): FlowIssue[] =>
  node.config.rules.flatMap((rule, ruleIndex) =>
    rule.conditions.flatMap((condition, conditionIndex) => {
      const variable = resolveVariable(variables, condition.variable);
      if (variable === null) {
        return [];
      }
      const path = ['rules', String(ruleIndex), 'conditions', String(conditionIndex)];
      if (!operatorsForType(variable.type).includes(condition.operator)) {
        return [
          createIssue(FlowIssueCode.OperatorTypeMismatch, {
            nodeId: node.id,
            path: [...path, 'operator'],
            params: { operator: condition.operator, type: variable.type },
          }),
        ];
      }
      if (!conditionValueFits(condition.operator, variable, condition.value)) {
        return [
          createIssue(FlowIssueCode.InvalidConditionValue, {
            nodeId: node.id,
            path: [...path, 'value'],
            params: { operator: condition.operator, type: variable.type },
          }),
        ];
      }
      return [];
    }),
  );

const listVariableIssues = (
  node: SendMessageNode,
  variables: readonly VisibleVariable[],
): FlowIssue[] => {
  const { content, quickReplies } = node.config;
  const lists = [
    ...(content.kind === MessageContentKind.List
      ? [{ path: ['content', 'variable'], variable: content.variable }]
      : []),
    ...(quickReplies.kind === QuickRepliesKind.Variable
      ? [{ path: ['quickReplies', 'variable'], variable: quickReplies.variable }]
      : []),
  ];
  return lists.flatMap(({ path, variable }) => {
    const resolved = resolveVariable(variables, variable);
    return resolved === null || LIST_TYPES.includes(resolved.type)
      ? []
      : [
          createIssue(FlowIssueCode.VariableTypeMismatch, {
            nodeId: node.id,
            path,
            params: { variable: variable.trim(), type: resolved.type },
          }),
        ];
  });
};

const nodeReferenceIssues = (context: ValidationContext, node: FlowNode): FlowIssue[] => {
  const variables = context.scope(node.id);
  return [
    ...nodeTextFields(node).flatMap((field) =>
      field.kind === NodeTextKind.Template
        ? templateIssues(node, field, variables)
        : variableIssues(node, field, variables),
    ),
    ...(node.type === NodeType.Router ? conditionIssues(node, variables) : []),
    ...(node.type === NodeType.SendMessage ? listVariableIssues(node, variables) : []),
  ];
};

export const referenceIssues = (context: ValidationContext): FlowIssue[] =>
  context.flow.nodes
    .filter((node) => context.reachable.has(node.id))
    .flatMap((node) => nodeReferenceIssues(context, node));
