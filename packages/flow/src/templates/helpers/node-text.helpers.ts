import { NodeType } from '@flow/document/constants/flow.constants';
import type { FlowNode, PromptSource } from '@flow/document/typedefs/flow.typedefs';
import {
  EscalationMode,
  MessageContentKind,
  QuickRepliesKind,
  RequestBodyKind,
} from '@flow/nodes/constants/step.constants';
import { PromptSourceKind } from '@flow/references/constants/reference.constants';
import { NodeTextKind } from '@flow/templates/constants/template.constants';
import type { NodeTextField, NodeTextMappers } from '@flow/templates/typedefs/template.typedefs';

const template = (path: readonly string[], value: string): NodeTextField => ({
  kind: NodeTextKind.Template,
  path,
  value,
});

const variable = (path: readonly string[], value: string): NodeTextField => ({
  kind: NodeTextKind.Variable,
  path,
  value,
});

const promptFields = (prompt: PromptSource | null): readonly NodeTextField[] =>
  prompt !== null && prompt.kind === PromptSourceKind.Inline
    ? [template(['prompt', 'text'], prompt.text)]
    : [];

const mapPrompt = (prompt: PromptSource | null, mappers: NodeTextMappers): PromptSource | null =>
  prompt !== null && prompt.kind === PromptSourceKind.Inline
    ? { ...prompt, text: mappers.template(prompt.text) }
    : prompt;

export const nodeTextFields = (node: FlowNode): readonly NodeTextField[] => {
  switch (node.type) {
    case NodeType.Router:
      return node.config.rules.flatMap((rule, ruleIndex) =>
        rule.conditions.map((condition, conditionIndex) =>
          variable(
            ['rules', String(ruleIndex), 'conditions', String(conditionIndex), 'variable'],
            condition.variable,
          ),
        ),
      );
    case NodeType.ApiRequest: {
      const { url, headers, body } = node.config;
      return [
        template(['url'], url),
        ...headers.map((header, index) =>
          template(['headers', String(index), 'value'], header.value),
        ),
        ...(body.kind === RequestBodyKind.None
          ? []
          : [template(['body', 'content'], body.content)]),
      ];
    }
    case NodeType.SendMessage: {
      const { content, quickReplies } = node.config;
      return [
        content.kind === MessageContentKind.List
          ? variable(['content', 'variable'], content.variable)
          : template(['content', 'text'], content.text),
        ...(quickReplies.kind === QuickRepliesKind.Variable
          ? [variable(['quickReplies', 'variable'], quickReplies.variable)]
          : []),
      ];
    }
    case NodeType.Escalation: {
      const { config } = node;
      const customer =
        config.customerMessage === null
          ? []
          : [template(['customerMessage'], config.customerMessage)];
      if (config.mode === EscalationMode.End) {
        return customer;
      }
      return [
        ...customer,
        template(['reason'], config.reason),
        template(['fallbackMessage'], config.fallbackMessage),
      ];
    }
    case NodeType.Agent:
    case NodeType.Completion:
      return promptFields(node.config.prompt);
    case NodeType.TriggerMessage:
    case NodeType.TriggerExternalEvent:
    case NodeType.TriggerSchedule:
    case NodeType.Parallel:
      return [];
  }
};

export const mapNodeText = (node: FlowNode, mappers: NodeTextMappers): FlowNode => {
  switch (node.type) {
    case NodeType.Router:
      return {
        ...node,
        config: {
          rules: node.config.rules.map((rule) => ({
            ...rule,
            conditions: rule.conditions.map((condition) => ({
              ...condition,
              variable: mappers.variable(condition.variable),
            })),
          })),
        },
      };
    case NodeType.ApiRequest: {
      const { config } = node;
      return {
        ...node,
        config: {
          ...config,
          url: mappers.template(config.url),
          headers: config.headers.map((header) => ({
            ...header,
            value: mappers.template(header.value),
          })),
          body:
            config.body.kind === RequestBodyKind.None
              ? config.body
              : { ...config.body, content: mappers.template(config.body.content) },
        },
      };
    }
    case NodeType.SendMessage: {
      const { config } = node;
      return {
        ...node,
        config: {
          ...config,
          content:
            config.content.kind === MessageContentKind.List
              ? { ...config.content, variable: mappers.variable(config.content.variable) }
              : { ...config.content, text: mappers.template(config.content.text) },
          quickReplies:
            config.quickReplies.kind === QuickRepliesKind.Variable
              ? { ...config.quickReplies, variable: mappers.variable(config.quickReplies.variable) }
              : config.quickReplies,
        },
      };
    }
    case NodeType.Escalation: {
      const { config } = node;
      const customerMessage =
        config.customerMessage === null ? null : mappers.template(config.customerMessage);
      if (config.mode === EscalationMode.End) {
        return { ...node, config: { ...config, customerMessage } };
      }
      return {
        ...node,
        config: {
          ...config,
          customerMessage,
          reason: mappers.template(config.reason),
          fallbackMessage: mappers.template(config.fallbackMessage),
        },
      };
    }
    case NodeType.Agent:
      return {
        ...node,
        config: { ...node.config, prompt: mapPrompt(node.config.prompt, mappers) },
      };
    case NodeType.Completion:
      return {
        ...node,
        config: { ...node.config, prompt: mapPrompt(node.config.prompt, mappers) },
      };
    case NodeType.TriggerMessage:
    case NodeType.TriggerExternalEvent:
    case NodeType.TriggerSchedule:
    case NodeType.Parallel:
      return node;
  }
};
