import type { Locale } from '@agent-ic/contracts';
import type { ConditionOperator } from '@flow/conditions/constants/condition.constants';
import { RuleMatch } from '@flow/conditions/constants/condition.constants';
import { FLOW_SCHEMA_VERSION, NodeType, PortName } from '@flow/document/constants/flow.constants';
import type {
  AgentExits,
  AgentNode,
  ApiRequestNode,
  CompletionNode,
  ConditionValue,
  EscalationNode,
  FlowDocument,
  HandoffSettings,
  ModelRef,
  OutputField,
  ParallelNode,
  PromptSource,
  RouterNode,
  RouterRule,
  SendMessageNode,
  TriggerInactivityNode,
  TriggerMessageNode,
  TriggerScheduleNode,
} from '@flow/document/typedefs/flow.typedefs';
import {
  CUSTOMER_MESSAGE_LABEL,
  FALLBACK_MESSAGE,
  HAND_OFF_MESSAGE,
} from '@flow/examples/constants/agent-example-texts.constants';
import {
  AGENT_EXAMPLE_COLUMN_WIDTH,
  AGENT_EXAMPLE_ROW_HEIGHT,
  AGENT_EXAMPLE_TRIGGER_KEY,
} from '@flow/examples/constants/agent-example.constants';
import type { AgentExamplePromptKey } from '@flow/examples/constants/agent-example.constants';
import type {
  AgentExampleCell,
  AgentExampleDraft,
  AgentExampleEdge,
  AgentExampleOptions,
  AgentExampleRequest,
  AgentStepSpec,
  CompletionStepSpec,
  LocalizedText,
} from '@flow/examples/typedefs/agent-example.typedefs';
import {
  AGENT_DEFAULT_RETRIES,
  API_REQUEST_DEFAULT_RETRIES,
  API_REQUEST_DEFAULT_TIMEOUT_SECONDS,
  ESCALATION_DEFAULT_FALLBACK_MINUTES,
  ESCALATION_DEFAULT_REMINDER_MINUTES,
} from '@flow/limits/constants/limit.constants';
import {
  DEFAULT_RETRIEVAL_MODE,
  EscalationMode,
  HttpMethod,
  MessageContentKind,
  NO_AGENT_EXITS,
  NotifyChannel,
  QuickRepliesKind,
  RecipientsKind,
  RequestAuthKind,
  RequestBodyKind,
  WaitFor,
} from '@flow/nodes/constants/step.constants';
import { ChannelSelectionMode } from '@flow/nodes/constants/trigger.constants';
import {
  AGENT_MESSAGES_FIELD_NAME,
  OutputFieldType,
} from '@flow/outputs/constants/output.constants';
import {
  ModelProviderKind,
  PromptSourceKind,
  PromptVersionKind,
} from '@flow/references/constants/reference.constants';

export const localize = (text: LocalizedText, locale: Locale): string => text[locale];

export const localizer =
  (locale: Locale) =>
  (text: LocalizedText): string =>
    localize(text, locale);

const place = (key: string, label: string, [column, row]: AgentExampleCell) => ({
  id: key,
  key,
  label,
  position: { x: column * AGENT_EXAMPLE_COLUMN_WIDTH, y: row * AGENT_EXAMPLE_ROW_HEIGHT },
});

const promptSource = (
  options: AgentExampleOptions,
  key: AgentExamplePromptKey,
): PromptSource | null => {
  const promptRef = options.promptRefs[key];
  return promptRef === undefined
    ? null
    : {
        kind: PromptSourceKind.Library,
        promptRef,
        pin: { kind: PromptVersionKind.Latest },
        bindings: {},
      };
};

const platformModel = (model: string): ModelRef => ({
  provider: { kind: ModelProviderKind.Platform },
  model,
});

const quickReplies = (buttons: readonly string[]): SendMessageNode['config']['quickReplies'] =>
  buttons.length === 0
    ? { kind: QuickRepliesKind.None }
    : { kind: QuickRepliesKind.Static, buttons: [...buttons] };

export const messagesOf = (agentKey: string): string => `${agentKey}.${AGENT_MESSAGES_FIELD_NAME}`;

export const exampleField = (
  name: string,
  type: Exclude<OutputFieldType, OutputFieldType.Enum>,
  description: string,
  required = true,
): OutputField => ({ name, type, description, required });

export const exampleEnumField = (
  name: string,
  description: string,
  values: readonly string[],
): OutputField => ({
  name,
  type: OutputFieldType.Enum,
  description,
  required: true,
  values: [...values],
});

export const handoffExit = (when: string): AgentExits => ({ end: null, handoff: { when } });

export const endExit = (when: string): AgentExits => ({ end: { when }, handoff: null });

export const exampleHandoffSettings = (locale: Locale): HandoffSettings => ({
  notify: {
    recipients: { kind: RecipientsKind.Operators },
    channels: [NotifyChannel.InPlatform, NotifyChannel.Email],
  },
  reminderAfterMinutes: ESCALATION_DEFAULT_REMINDER_MINUTES,
  fallbackAfterMinutes: ESCALATION_DEFAULT_FALLBACK_MINUTES,
  fallbackMessage: localize(FALLBACK_MESSAGE, locale),
});

export const messageTrigger = (
  options: AgentExampleOptions,
  at: AgentExampleCell,
): TriggerMessageNode => ({
  ...place(AGENT_EXAMPLE_TRIGGER_KEY, localize(CUSTOMER_MESSAGE_LABEL, options.locale), at),
  type: NodeType.TriggerMessage,
  config: { channels: { mode: ChannelSelectionMode.All } },
});

export const inactivityTrigger = (
  key: string,
  label: string,
  at: AgentExampleCell,
  config: TriggerInactivityNode['config'],
): TriggerInactivityNode => ({
  ...place(key, label, at),
  type: NodeType.TriggerInactivity,
  config,
});

export const scheduleTrigger = (
  key: string,
  label: string,
  at: AgentExampleCell,
  config: TriggerScheduleNode['config'],
): TriggerScheduleNode => ({
  ...place(key, label, at),
  type: NodeType.TriggerSchedule,
  config,
});

export const agentStep = (options: AgentExampleOptions, spec: AgentStepSpec): AgentNode => ({
  ...place(spec.key, spec.label, spec.at),
  type: NodeType.Agent,
  config: {
    prompt: promptSource(options, spec.prompt),
    model: platformModel(options.models.agent),
    reasoning: null,
    knowledgeBaseIds: spec.knowledge === true ? [...options.knowledgeBaseIds] : [],
    retrievalMode: DEFAULT_RETRIEVAL_MODE,
    output: [...(spec.output ?? [])],
    retries: AGENT_DEFAULT_RETRIES,
    exits: spec.exits ?? NO_AGENT_EXITS,
  },
});

export const completionStep = (
  options: AgentExampleOptions,
  spec: CompletionStepSpec,
): CompletionNode => ({
  ...place(spec.key, spec.label, spec.at),
  type: NodeType.Completion,
  config: {
    prompt: promptSource(options, spec.prompt),
    model: platformModel(options.models.completion),
    reasoning: null,
    input: { includeCurrentMessage: true },
    output: [...spec.output],
  },
});

export const exampleRule = (
  id: string,
  label: string,
  variable: string,
  operator: ConditionOperator,
  value: ConditionValue = null,
): RouterRule => ({
  id,
  label,
  match: RuleMatch.All,
  conditions: [{ variable, operator, value }],
});

export const routerStep = (
  key: string,
  label: string,
  at: AgentExampleCell,
  rules: readonly RouterRule[],
): RouterNode => ({
  ...place(key, label, at),
  type: NodeType.Router,
  config: { rules: [...rules] },
});

export const parallelStep = (key: string, label: string, at: AgentExampleCell): ParallelNode => ({
  ...place(key, label, at),
  type: NodeType.Parallel,
  config: { waitFor: WaitFor.All },
});

export const apiRequestStep = (
  key: string,
  label: string,
  at: AgentExampleCell,
  request: AgentExampleRequest,
): ApiRequestNode => ({
  ...place(key, label, at),
  type: NodeType.ApiRequest,
  config: {
    method: HttpMethod.Post,
    url: request.url,
    headers: [],
    body: { kind: RequestBodyKind.Json, content: request.body },
    auth: { kind: RequestAuthKind.None },
    timeoutSeconds: API_REQUEST_DEFAULT_TIMEOUT_SECONDS,
    retries: API_REQUEST_DEFAULT_RETRIES,
    onFailure: request.onFailure,
  },
});

export const sendText = (
  key: string,
  label: string,
  at: AgentExampleCell,
  text: string,
  buttons: readonly string[] = [],
): SendMessageNode => ({
  ...place(key, label, at),
  type: NodeType.SendMessage,
  config: {
    content: { kind: MessageContentKind.Text, text },
    typing: true,
    waitForDelivery: false,
    quickReplies: quickReplies(buttons),
  },
});

export const sendMessages = (
  key: string,
  label: string,
  at: AgentExampleCell,
  agentKey: string,
  buttons: readonly string[] = [],
): SendMessageNode => ({
  ...place(key, label, at),
  type: NodeType.SendMessage,
  config: {
    content: { kind: MessageContentKind.List, variable: messagesOf(agentKey) },
    typing: true,
    waitForDelivery: false,
    quickReplies: quickReplies(buttons),
  },
});

export const handOff = (
  options: AgentExampleOptions,
  key: string,
  label: string,
  at: AgentExampleCell,
  reason: string,
): EscalationNode => ({
  ...place(key, label, at),
  type: NodeType.Escalation,
  config: {
    mode: EscalationMode.Escalate,
    customerMessage: localize(HAND_OFF_MESSAGE, options.locale),
    reason,
    ...exampleHandoffSettings(options.locale),
  },
});

export const endChat = (
  key: string,
  label: string,
  at: AgentExampleCell,
  customerMessage: string | null,
): EscalationNode => ({
  ...place(key, label, at),
  type: NodeType.Escalation,
  config: { mode: EscalationMode.End, customerMessage },
});

export const link = (
  source: string,
  target: string,
  sourcePort: string = PortName.Next,
): AgentExampleEdge => ({ source, sourcePort, target });

export const branchLink = (source: string, target: string): AgentExampleEdge =>
  link(source, target, PortName.Branches);

export const backgroundLink = (source: string, target: string): AgentExampleEdge => ({
  ...branchLink(source, target),
  background: true,
});

export const assembleFlow = (draft: AgentExampleDraft, nextId: () => string): FlowDocument => {
  const ids = new Map(draft.nodes.map((node) => [node.key, nextId()]));
  const idOf = (key: string): string => ids.get(key) ?? key;
  return {
    schemaVersion: FLOW_SCHEMA_VERSION,
    nodes: draft.nodes.map((node) => ({ ...node, id: idOf(node.key) })),
    edges: draft.edges.map((edge) => ({
      ...edge,
      id: nextId(),
      source: idOf(edge.source),
      target: idOf(edge.target),
    })),
    settings: draft.settings,
  };
};
