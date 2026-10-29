import {
  AGENT_DEFAULT_RETRIES,
  API_REQUEST_DEFAULT_RETRIES,
  API_REQUEST_DEFAULT_TIMEOUT_SECONDS,
  ChannelSelectionMode,
  DEFAULT_RETRIEVAL_MODE,
  ESCALATION_DEFAULT_FALLBACK_MINUTES,
  ESCALATION_DEFAULT_REMINDER_MINUTES,
  EscalationMode,
  FLOW_SCHEMA_VERSION,
  MessageContentKind,
  NO_AGENT_EXITS,
  NO_FLOW_SETTINGS,
  NodeType,
  NotifyChannel,
  OutputFieldType,
  PortName,
  PromptSourceKind,
  PromptVersionKind,
  QuickRepliesKind,
  RecipientsKind,
  RequestAuthKind,
  RequestBodyKind,
  RuleMatch,
  WaitFor,
} from '@agent-ic/flow';
import type {
  AgentExits,
  AgentNode,
  ApiRequestNode,
  CompletionNode,
  ConditionOperator,
  ConditionValue,
  EscalationNode,
  FlowDocument,
  OutputField,
  ParallelNode,
  PromptSource,
  RouterNode,
  RouterRule,
  SendMessageNode,
  TriggerMessageNode,
} from '@agent-ic/flow';
import {
  EXAMPLE_AGENT_MODEL,
  EXAMPLE_COLUMN_WIDTH,
  EXAMPLE_COMPLETION_MODEL,
  EXAMPLE_FALLBACK_MESSAGE,
  EXAMPLE_HAND_OFF_MESSAGE,
  EXAMPLE_ROW_HEIGHT,
  EXAMPLE_TRIGGER_KEY,
  EXAMPLE_TRIGGER_LABEL,
} from '@/modules/agents/constants/flow-example-nodes.constants';
import type {
  ExampleRequest,
  FlowExample,
  FlowExampleEdge,
  GridCell,
} from '@/modules/agents/typedefs/flow-example.typedefs';

const place = (key: string, label: string, [column, row]: GridCell) => ({
  id: key,
  key,
  label,
  position: { x: column * EXAMPLE_COLUMN_WIDTH, y: row * EXAMPLE_ROW_HEIGHT },
});

export const examplePrompt = (
  promptRef: string,
  bindings: PromptSource['bindings'] = {},
): PromptSource => ({
  kind: PromptSourceKind.Library,
  promptRef,
  pin: { kind: PromptVersionKind.Latest },
  bindings,
});

const quickReplies = (buttons: readonly string[]): SendMessageNode['config']['quickReplies'] =>
  buttons.length === 0
    ? { kind: QuickRepliesKind.None }
    : { kind: QuickRepliesKind.Static, buttons: [...buttons] };

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

export const exampleTrigger = (at: GridCell): TriggerMessageNode => ({
  ...place(EXAMPLE_TRIGGER_KEY, EXAMPLE_TRIGGER_LABEL, at),
  type: NodeType.TriggerMessage,
  config: { channels: { mode: ChannelSelectionMode.All } },
});

export const exampleAgent = (
  key: string,
  label: string,
  at: GridCell,
  prompt: PromptSource,
  output: readonly OutputField[] = [],
  exits: AgentExits = NO_AGENT_EXITS,
): AgentNode => ({
  ...place(key, label, at),
  type: NodeType.Agent,
  config: {
    prompt,
    model: EXAMPLE_AGENT_MODEL,
    reasoning: null,
    knowledgeBaseIds: [],
    retrievalMode: DEFAULT_RETRIEVAL_MODE,
    output: [...output],
    retries: AGENT_DEFAULT_RETRIES,
    exits,
  },
});

export const exampleCompletion = (
  key: string,
  label: string,
  at: GridCell,
  prompt: PromptSource,
  output: readonly OutputField[],
): CompletionNode => ({
  ...place(key, label, at),
  type: NodeType.Completion,
  config: {
    prompt,
    model: EXAMPLE_COMPLETION_MODEL,
    reasoning: null,
    input: { includeCurrentMessage: true },
    output: [...output],
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

export const exampleRouter = (
  key: string,
  label: string,
  at: GridCell,
  rules: readonly RouterRule[],
): RouterNode => ({
  ...place(key, label, at),
  type: NodeType.Router,
  config: { rules: [...rules] },
});

export const exampleParallel = (key: string, label: string, at: GridCell): ParallelNode => ({
  ...place(key, label, at),
  type: NodeType.Parallel,
  config: { waitFor: WaitFor.All },
});

export const exampleApiRequest = (
  key: string,
  label: string,
  at: GridCell,
  request: ExampleRequest,
): ApiRequestNode => ({
  ...place(key, label, at),
  type: NodeType.ApiRequest,
  config: {
    method: request.method,
    url: request.url,
    headers: [],
    body:
      request.body === null
        ? { kind: RequestBodyKind.None }
        : { kind: RequestBodyKind.Json, content: request.body },
    auth: { kind: RequestAuthKind.None },
    timeoutSeconds: API_REQUEST_DEFAULT_TIMEOUT_SECONDS,
    retries: API_REQUEST_DEFAULT_RETRIES,
    onFailure: request.onFailure,
  },
});

export const exampleSendText = (
  key: string,
  label: string,
  at: GridCell,
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

export const exampleSendReply = (
  key: string,
  label: string,
  at: GridCell,
  variable: string,
  buttons: readonly string[] = [],
): SendMessageNode => ({
  ...place(key, label, at),
  type: NodeType.SendMessage,
  config: {
    content: { kind: MessageContentKind.List, variable },
    typing: true,
    waitForDelivery: false,
    quickReplies: quickReplies(buttons),
  },
});

export const exampleHandOff = (
  key: string,
  label: string,
  at: GridCell,
  reason: string,
): EscalationNode => ({
  ...place(key, label, at),
  type: NodeType.Escalation,
  config: {
    mode: EscalationMode.Escalate,
    customerMessage: EXAMPLE_HAND_OFF_MESSAGE,
    reason,
    notify: {
      recipients: { kind: RecipientsKind.Operators },
      channels: [NotifyChannel.InPlatform],
    },
    reminderAfterMinutes: ESCALATION_DEFAULT_REMINDER_MINUTES,
    fallbackAfterMinutes: ESCALATION_DEFAULT_FALLBACK_MINUTES,
    fallbackMessage: EXAMPLE_FALLBACK_MESSAGE,
  },
});

export const exampleEndChat = (
  key: string,
  label: string,
  at: GridCell,
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
): FlowExampleEdge => ({ source, sourcePort, target });

export const backgroundLink = (source: string, target: string): FlowExampleEdge => ({
  ...link(source, target, PortName.Branches),
  background: true,
});

export const buildExampleFlow = (example: FlowExample, nextId: () => string): FlowDocument => {
  const ids = new Map(example.nodes.map((node) => [node.key, nextId()]));
  const idOf = (key: string): string => ids.get(key) ?? key;
  return {
    schemaVersion: FLOW_SCHEMA_VERSION,
    nodes: example.nodes.map((node) => ({ ...node, id: idOf(node.key) })),
    edges: example.edges.map((edge) => ({
      ...edge,
      id: nextId(),
      source: idOf(edge.source),
      target: idOf(edge.target),
    })),
    settings: example.settings ?? NO_FLOW_SETTINGS,
  };
};
