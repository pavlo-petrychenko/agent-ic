import {
  ChannelSelectionMode,
  EscalationMode,
  MessageContentKind,
  NodeType,
  PromptSourceKind,
} from '@agent-ic/flow';
import type { FlowNode, ModelRef, PromptSource } from '@agent-ic/flow';
import {
  LABELLED_PORTS,
  OUTPUT_FIELDS_SEPARATOR,
  SummaryKey,
} from '@/features/flow-builder/constants/nodeSummary.constants';
import type { PortLabel, SummaryPart } from '@/features/flow-builder/typedefs/nodeSummary.typedefs';

const part = (key: SummaryKey, params: SummaryPart['params'] = {}): SummaryPart => ({
  key,
  params,
});

const modelAndPrompt = (model: ModelRef | null, prompt: PromptSource | null): SummaryPart[] => [
  model === null ? part(SummaryKey.NoModel) : part(SummaryKey.Model, { model: model.model }),
  ...(prompt === null
    ? []
    : [
        part(
          prompt.kind === PromptSourceKind.Inline
            ? SummaryKey.InlinePrompt
            : SummaryKey.LibraryPrompt,
        ),
      ]),
];

export const nodeSummary = (node: FlowNode): readonly SummaryPart[] => {
  switch (node.type) {
    case NodeType.TriggerMessage:
      return node.config.channels.mode === ChannelSelectionMode.All
        ? [part(SummaryKey.AllChannels)]
        : [part(SummaryKey.SomeChannels, { count: node.config.channels.channelIds.length })];
    case NodeType.Agent:
      return modelAndPrompt(node.config.model, node.config.prompt);
    case NodeType.Completion:
      return [
        part(SummaryKey.Outputs, {
          fields: node.config.output.map((field) => field.name).join(OUTPUT_FIELDS_SEPARATOR),
        }),
      ];
    case NodeType.SendMessage:
      return node.config.content.kind === MessageContentKind.List
        ? [part(SummaryKey.EachItem, { variable: node.config.content.variable })]
        : [part(SummaryKey.Text, { text: node.config.content.text })];
    case NodeType.ApiRequest:
      return [part(SummaryKey.Request, { method: node.config.method, url: node.config.url })];
    case NodeType.Escalation:
      return [
        part(
          node.config.mode === EscalationMode.Escalate ? SummaryKey.NotifyTeam : SummaryKey.EndChat,
        ),
      ];
    default:
      return [];
  }
};

export const portLabel = (node: FlowNode, port: string): PortLabel | null => {
  const rule =
    node.type === NodeType.Router ? node.config.rules.find((item) => item.id === port) : undefined;
  if (rule !== undefined) {
    return rule.label === '' ? null : { rule: rule.label };
  }
  const fixed = LABELLED_PORTS.find((name) => name === port);
  return fixed === undefined ? null : { port: fixed };
};
