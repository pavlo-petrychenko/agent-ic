import { WorkspaceRole } from '@agent-ic/contracts';
import { ConditionOperator, RuleMatch } from '@flow/conditions/constants/condition.constants';
import { FLOW_SCHEMA_VERSION, NodeType } from '@flow/document/constants/flow.constants';
import type {
  AgentNode,
  ApiRequestNode,
  CompletionNode,
  EscalationNode,
  FlowDocument,
  FlowEdge,
  FlowNode,
  OutputField,
  ParallelNode,
  RouterNode,
  RouterRule,
  SendMessageNode,
  TriggerExternalEventNode,
  TriggerMessageNode,
  TriggerScheduleNode,
} from '@flow/document/typedefs/flow.typedefs';
import {
  type CompletionRole,
  EscalationMode,
  FailureMode,
  HttpMethod,
  MessageContentKind,
  NotifyChannel,
  QuickRepliesKind,
  RecipientsKind,
  RequestAuthKind,
  RequestBodyKind,
  RetrievalMode,
  type WaitFor,
} from '@flow/nodes/constants/step.constants';
import {
  ChannelSelectionMode,
  ReplyMode,
  ScheduleKind,
} from '@flow/nodes/constants/trigger.constants';
import { OutputFieldType } from '@flow/outputs/constants/output.constants';
import { exampleModel, examplePrompt } from '@test/support/fixtures/example-flow.fixture';

const base = (key: string) => ({
  id: `n_${key}`,
  key,
  label: key,
  position: { x: 0, y: 0 },
});

export const field = (
  name: string,
  type: OutputFieldType = OutputFieldType.String,
  required = true,
): OutputField =>
  type === OutputFieldType.Enum
    ? { name, type, description: '', required, values: ['a', 'b'] }
    : { name, type, description: '', required };

export const messageTrigger = (key: string): TriggerMessageNode => ({
  ...base(key),
  type: NodeType.TriggerMessage,
  config: { channels: { mode: ChannelSelectionMode.All } },
});

export const eventTrigger = (
  key: string,
  eventName: string | null = key.replaceAll('_', '-'),
  examplePayload: TriggerExternalEventNode['config']['examplePayload'] = {},
  replyMode: ReplyMode = ReplyMode.DontWait,
): TriggerExternalEventNode => ({
  ...base(key),
  type: NodeType.TriggerExternalEvent,
  config: {
    eventName,
    channelId: 'chn_api',
    examplePayload,
    replyMode,
  },
});

export const scheduleTrigger = (key: string, cron: string | null = null): TriggerScheduleNode => ({
  ...base(key),
  type: NodeType.TriggerSchedule,
  config: {
    schedule:
      cron === null
        ? { kind: ScheduleKind.Daily, time: '09:30', timeZone: 'Europe/Kyiv' }
        : { kind: ScheduleKind.Custom, cron, timeZone: 'Europe/Kyiv' },
    conditions: { silentForHours: null, notEscalated: true, channelTypes: [] },
    maxConversationsPerRun: 10,
    oncePerConversation: true,
  },
});

export const agent = (key: string, output: OutputField[] = []): AgentNode => ({
  ...base(key),
  type: NodeType.Agent,
  config: {
    prompt: examplePrompt(`prm_${key}`),
    model: exampleModel,
    knowledgeBaseIds: [],
    retrievalMode: RetrievalMode.Tools,
    output,
    retries: 2,
  },
});

export const completion = (
  key: string,
  role: CompletionRole,
  output: OutputField[] = [field('verdict', OutputFieldType.Boolean)],
): CompletionNode => ({
  ...base(key),
  type: NodeType.Completion,
  config: {
    role,
    prompt: examplePrompt(`prm_${key}`),
    model: exampleModel,
    input: { includeCurrentMessage: true },
    output,
  },
});

export const rule = (
  id: string,
  variable: string,
  operator = ConditionOperator.IsTrue,
  value: RouterRule['conditions'][number]['value'] = null,
): RouterRule => ({
  id,
  label: id,
  match: RuleMatch.All,
  conditions: [{ variable, operator, value }],
});

export const router = (key: string, rules: RouterRule[]): RouterNode => ({
  ...base(key),
  type: NodeType.Router,
  config: { rules },
});

export const parallel = (key: string, waitFor: WaitFor): ParallelNode => ({
  ...base(key),
  type: NodeType.Parallel,
  config: { waitFor },
});

export const apiRequest = (
  key: string,
  url = 'https://example.com',
  onFailure: FailureMode = FailureMode.Continue,
): ApiRequestNode => ({
  ...base(key),
  type: NodeType.ApiRequest,
  config: {
    method: HttpMethod.Post,
    url,
    headers: [{ name: 'X-Trace', value: '{{today}}' }],
    body: { kind: RequestBodyKind.Json, content: '{}' },
    auth: { kind: RequestAuthKind.None },
    timeoutSeconds: 5,
    retries: 2,
    onFailure,
  },
});

export const sendText = (key: string, text: string): SendMessageNode => ({
  ...base(key),
  type: NodeType.SendMessage,
  config: {
    content: { kind: MessageContentKind.Text, text },
    typing: true,
    waitForDelivery: true,
    quickReplies: { kind: QuickRepliesKind.None },
  },
});

export const sendList = (key: string, variable: string): SendMessageNode => ({
  ...base(key),
  type: NodeType.SendMessage,
  config: {
    content: { kind: MessageContentKind.List, variable },
    typing: true,
    waitForDelivery: true,
    quickReplies: { kind: QuickRepliesKind.Variable, variable },
  },
});

export const escalation = (
  key: string,
  reason = 'help',
  fallbackMessage = 'Sorry',
): EscalationNode => ({
  ...base(key),
  type: NodeType.Escalation,
  config: {
    mode: EscalationMode.Escalate,
    customerMessage: null,
    reason,
    notify: {
      recipients: { kind: RecipientsKind.Role, role: WorkspaceRole.Operator },
      channels: [NotifyChannel.InPlatform],
    },
    reminderAfterMinutes: null,
    fallbackAfterMinutes: 30,
    fallbackMessage,
  },
});

export const link = (source: FlowNode, port: string, target: FlowNode): FlowEdge => ({
  id: `e_${source.key}_${port}_${target.key}`,
  source: source.id,
  sourcePort: port,
  target: target.id,
});

export const flowOf = (nodes: FlowNode[], edges: FlowEdge[]): FlowDocument => ({
  schemaVersion: FLOW_SCHEMA_VERSION,
  nodes,
  edges,
});
