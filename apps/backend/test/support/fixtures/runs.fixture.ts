import {
  ConditionOperator,
  DEFAULT_RETRIEVAL_MODE,
  NO_AGENT_EXITS,
  FIRST_SCHEMA_VERSION,
  FlowV1CompletionRole,
  FlowV1WaitFor,
  EscalationMode,
  FailureMode,
  HttpMethod,
  MessageContentKind,
  ModelProviderKind,
  NodeType,
  NotifyChannel,
  OutputFieldType,
  PortName,
  QuickRepliesKind,
  RecipientsKind,
  RequestAuthKind,
  RequestBodyKind,
  RuleMatch,
  UnhandledFailureAction,
  ScheduleKind,
  ChannelType,
  InactivityActivity,
  InactivityRepeatKind,
  InactivityUnit,
} from '@agent-ic/flow';
import type {
  AgentNode,
  ApiRequestNode,
  CompletionNode,
  EscalationNode,
  FlowDocument,
  FlowEdge,
  FlowNode,
  ParallelNode,
  RouterNode,
  SendMessageNode,
  TriggerInactivityNode,
  TriggerScheduleNode,
  WaitFor,
} from '@agent-ic/flow';
import { ChannelKind, ConversationMode, ConversationState } from '@/modules/conversations';
import type { Conversation, Message, MessageAuthor } from '@/modules/conversations';
import {
  FIRST_STEP_ATTEMPT,
  ROOT_BRANCH_KEY,
  RunStatus,
  RunStepStatus,
  RunTrigger,
} from '@/modules/runs/constants/run.constants';
import type { EscalationRecipients } from '@/modules/runs/typedefs/escalation.typedefs';
import type { NewInactivityTimer } from '@/modules/runs/typedefs/inactivity-timer.typedefs';
import type {
  FinishedRunStepStatus,
  NewRunStep,
  RunStep,
} from '@/modules/runs/typedefs/run-step.typedefs';
import type { NewRun } from '@/modules/runs/typedefs/run.typedefs';
import type { IdService } from '@/platform/ids/services/id.service';
import { LlmModelId } from '@/platform/llm/constants/llm-model.constants';
import {
  TEST_API_BODY_TEMPLATE,
  TEST_API_HEADER_TEMPLATE,
  TEST_API_NODE_ID,
  TEST_API_NODE_KEY,
  TEST_API_TIMEOUT_SECONDS,
} from '@test/support/constants/agents-testing.constants';
import { TEST_END_USER_EXTERNAL_ID } from '@test/support/constants/conversations-testing.constants';
import { OUTBOUND_TEST_HEADER } from '@test/support/constants/outbound-http-testing.constants';
import {
  ESCALATION_NODE_ID,
  ESCALATION_NODE_KEY,
  FIRST_STEP_KEY,
  INACTIVITY_NODE_ID,
  INACTIVITY_NODE_KEY,
  RUNS_TEST_LATER,
  RUNS_TEST_START,
  SCHEDULE_NODE_ID,
  SCHEDULE_NODE_KEY,
  SEND_NODE_ID,
  SEND_NODE_KEY,
  TEST_CUSTOMER_NOTICE,
  TEST_ESCALATION_REASON,
  TEST_FAILURE_APOLOGY,
  TEST_QUICK_REPLIES,
  TEST_REPLIES_VARIABLE,
  TEST_END_USER_NAME,
  TEST_ROUTE_RULE_ID,
  TEST_INTENT_FIELD,
  TEST_ORDER_INTENT,
  TEST_ORDER_RULE_ID,
  TEST_QUESTION_INTENT,
  TEST_STEP_INPUT,
  TEST_STEP_NODE_ID,
  TEST_STEP_NODE_KEY,
  TEST_INACTIVITY_MAX_TIMES,
  TEST_REPEAT_HOURS,
  TEST_SCHEDULE_LIMIT,
  TEST_SILENCE_HOURS,
  TEST_SCHEDULE_TIME,
  TEST_SCHEDULE_TIME_ZONE,
} from '@test/support/constants/runs-testing.constants';
import { triggerFlow } from '@test/support/fixtures/agents.fixture';
import type { RunsTestbed } from '@test/support/typedefs/runs-testing.typedefs';

export const newRun = (testbed: Pick<RunsTestbed, 'ids'>, workspaceId: string): NewRun => ({
  id: testbed.ids.generate(),
  workspaceId,
  conversationId: testbed.ids.generate(),
  agentId: testbed.ids.generate(),
  versionId: testbed.ids.generate(),
  mode: ConversationMode.Live,
  trigger: RunTrigger.Message,
  status: RunStatus.Queued,
  lastCoveredMessageId: testbed.ids.generate(),
});

export const newInactivityTimer = (
  testbed: Pick<RunsTestbed, 'ids'>,
  run: NewRun,
  overrides: Partial<NewInactivityTimer> = {},
): NewInactivityTimer => ({
  id: testbed.ids.generate(),
  workspaceId: run.workspaceId,
  conversationId: run.conversationId,
  versionId: run.versionId,
  nodeId: TEST_STEP_NODE_ID,
  anchorAt: RUNS_TEST_START,
  attempt: 0,
  dueAt: RUNS_TEST_LATER,
  ...overrides,
});

export const newRunStep = (
  testbed: Pick<RunsTestbed, 'ids'>,
  run: NewRun,
  overrides: Partial<NewRunStep> = {},
): NewRunStep => ({
  id: testbed.ids.generate(),
  workspaceId: run.workspaceId,
  runId: run.id,
  nodeId: TEST_STEP_NODE_ID,
  nodeKey: TEST_STEP_NODE_KEY,
  branchKey: ROOT_BRANCH_KEY,
  input: TEST_STEP_INPUT,
  startedAt: RUNS_TEST_START,
  ...overrides,
});

const NODE_POSITION = { x: 0, y: 0 };

export const agentNode = (
  id: string,
  key: string,
  config: Partial<AgentNode['config']> = {},
): AgentNode => ({
  id,
  key,
  label: key,
  position: NODE_POSITION,
  type: NodeType.Agent,
  config: {
    prompt: null,
    model: null,
    knowledgeBaseIds: [],
    retrievalMode: DEFAULT_RETRIEVAL_MODE,
    output: [],
    retries: 0,
    reasoning: null,
    exits: NO_AGENT_EXITS,
    ...config,
  },
});

export const sendListNode = (id: string, key: string, variable: string): SendMessageNode => ({
  id,
  key,
  label: key,
  position: NODE_POSITION,
  type: NodeType.SendMessage,
  config: {
    content: { kind: MessageContentKind.List, variable },
    typing: false,
    waitForDelivery: false,
    quickReplies: { kind: QuickRepliesKind.None },
  },
});

export const observerNode = (id: string, key: string): CompletionNode => ({
  id,
  key,
  label: key,
  position: NODE_POSITION,
  type: NodeType.Completion,
  config: {
    prompt: null,
    model: null,
    reasoning: null,
    input: { includeCurrentMessage: true },
    output: [{ name: key, type: OutputFieldType.String, description: key, required: true }],
  },
});

export const routerNode = (id: string, key: string): RouterNode => ({
  id,
  key,
  label: key,
  position: NODE_POSITION,
  type: NodeType.Router,
  config: {
    rules: [
      {
        id: TEST_ROUTE_RULE_ID,
        label: TEST_ROUTE_RULE_ID,
        match: RuleMatch.All,
        conditions: [
          {
            variable: `${FIRST_STEP_KEY}.answer`,
            operator: ConditionOperator.Eq,
            value: FIRST_STEP_KEY,
          },
        ],
      },
    ],
  },
});

export const parallelNode = (id: string, key: string, waitFor: WaitFor): ParallelNode => ({
  id,
  key,
  label: key,
  position: NODE_POSITION,
  type: NodeType.Parallel,
  config: { waitFor },
});

export const apiRequestNode = (
  url: string,
  config: Partial<ApiRequestNode['config']> = {},
): ApiRequestNode => ({
  id: TEST_API_NODE_ID,
  key: TEST_API_NODE_KEY,
  label: TEST_API_NODE_KEY,
  position: NODE_POSITION,
  type: NodeType.ApiRequest,
  config: {
    method: HttpMethod.Post,
    url,
    headers: [{ name: OUTBOUND_TEST_HEADER, value: TEST_API_HEADER_TEMPLATE }],
    body: { kind: RequestBodyKind.Json, content: TEST_API_BODY_TEMPLATE },
    auth: { kind: RequestAuthKind.None },
    timeoutSeconds: TEST_API_TIMEOUT_SECONDS,
    retries: 0,
    onFailure: FailureMode.Continue,
    ...config,
  },
});

export const completionNode = (
  id: string,
  key: string,
  config: Partial<CompletionNode['config']> = {},
): CompletionNode => ({
  id,
  key,
  label: key,
  position: NODE_POSITION,
  type: NodeType.Completion,
  config: {
    prompt: null,
    model: { provider: { kind: ModelProviderKind.Platform }, model: LlmModelId.Ministral14b },
    reasoning: null,
    input: { includeCurrentMessage: true },
    output: [
      {
        name: TEST_INTENT_FIELD,
        type: OutputFieldType.Enum,
        values: [TEST_ORDER_INTENT, TEST_QUESTION_INTENT],
        description: '',
        required: true,
      },
    ],
    ...config,
  },
});

export const intentRouterNode = (id: string, key: string, guardKey: string): RouterNode => ({
  id,
  key,
  label: key,
  position: NODE_POSITION,
  type: NodeType.Router,
  config: {
    rules: [
      {
        id: TEST_ORDER_RULE_ID,
        label: TEST_ORDER_INTENT,
        match: RuleMatch.All,
        conditions: [
          {
            variable: `${guardKey}.${TEST_INTENT_FIELD}`,
            operator: ConditionOperator.Eq,
            value: TEST_ORDER_INTENT,
          },
        ],
      },
    ],
  },
});

export const endNode = (id: string, key: string): EscalationNode => ({
  id,
  key,
  label: key,
  position: NODE_POSITION,
  type: NodeType.Escalation,
  config: { mode: EscalationMode.End, customerMessage: null },
});

export const sendMessageNode = (): SendMessageNode => ({
  id: SEND_NODE_ID,
  key: SEND_NODE_KEY,
  label: SEND_NODE_KEY,
  position: NODE_POSITION,
  type: NodeType.SendMessage,
  config: {
    content: { kind: MessageContentKind.List, variable: TEST_REPLIES_VARIABLE },
    typing: true,
    waitForDelivery: false,
    quickReplies: { kind: QuickRepliesKind.Static, buttons: TEST_QUICK_REPLIES },
  },
});

export const escalateNode = (
  recipients: EscalationRecipients = { kind: RecipientsKind.Operators },
): EscalationNode => ({
  id: ESCALATION_NODE_ID,
  key: ESCALATION_NODE_KEY,
  label: ESCALATION_NODE_KEY,
  position: NODE_POSITION,
  type: NodeType.Escalation,
  config: {
    mode: EscalationMode.Escalate,
    customerMessage: TEST_CUSTOMER_NOTICE,
    reason: TEST_ESCALATION_REASON,
    notify: {
      recipients,
      channels: [NotifyChannel.InPlatform],
    },
    reminderAfterMinutes: null,
    fallbackAfterMinutes: null,
    fallbackMessage: TEST_CUSTOMER_NOTICE,
  },
});

export const scheduleTriggerNode = (): TriggerScheduleNode => ({
  id: SCHEDULE_NODE_ID,
  key: SCHEDULE_NODE_KEY,
  label: SCHEDULE_NODE_KEY,
  position: NODE_POSITION,
  type: NodeType.TriggerSchedule,
  config: {
    schedule: {
      kind: ScheduleKind.Daily,
      time: TEST_SCHEDULE_TIME,
      timeZone: TEST_SCHEDULE_TIME_ZONE,
    },
    conditions: {
      silentForHours: null,
      notEscalated: true,
      channelTypes: [ChannelType.Telegram, ChannelType.Api],
    },
    maxConversationsPerRun: TEST_SCHEDULE_LIMIT,
    oncePerConversation: true,
  },
});

export const inactivityTriggerNode = (
  config: Partial<TriggerInactivityNode['config']> = {},
): TriggerInactivityNode => ({
  id: INACTIVITY_NODE_ID,
  key: INACTIVITY_NODE_KEY,
  label: INACTIVITY_NODE_KEY,
  position: NODE_POSITION,
  type: NodeType.TriggerInactivity,
  config: {
    silence: { amount: TEST_SILENCE_HOURS, unit: InactivityUnit.Hours },
    activity: InactivityActivity.Any,
    repeat: {
      kind: InactivityRepeatKind.Every,
      every: { amount: TEST_REPEAT_HOURS, unit: InactivityUnit.Hours },
      maxTimes: TEST_INACTIVITY_MAX_TIMES,
    },
    conditions: { notEscalated: true, channelTypes: [] },
    ...config,
  },
});

export const flowEdge = (
  source: string,
  target: string,
  port: string = PortName.Next,
): FlowEdge => ({
  id: `${source}:${port}:${target}`,
  source,
  sourcePort: port,
  target,
});

export const branchEdge = (parallelId: string, target: string): FlowEdge => ({
  ...flowEdge(parallelId, target, PortName.Branches),
  id: `${parallelId}:${target}`,
});

export const backgroundBranchEdge = (parallelId: string, target: string): FlowEdge => ({
  ...branchEdge(parallelId, target),
  background: true,
});

export const triggerOnlyFlow = (): FlowDocument => {
  const trigger = triggerFlow();
  return {
    ...trigger,
    nodes: trigger.nodes.filter((node) => node.type === NodeType.TriggerMessage),
    edges: [],
  };
};

export const flowV1Json = (flow: FlowDocument): unknown => ({
  schemaVersion: FIRST_SCHEMA_VERSION,
  nodes: flow.nodes.map((node) => {
    switch (node.type) {
      case NodeType.Completion:
        return { ...node, config: { ...node.config, role: FlowV1CompletionRole.Observer } };
      case NodeType.Parallel:
        return { ...node, config: { waitFor: FlowV1WaitFor.Guards } };
      default:
        return node;
    }
  }),
  edges: flow.edges.map(({ background: _background, ...edge }) => edge),
});

export const stepFlow = (nodes: readonly FlowNode[], edges: readonly FlowEdge[]): FlowDocument => {
  const trigger = triggerOnlyFlow();
  return { ...trigger, nodes: [...trigger.nodes, ...nodes], edges: [...edges] };
};

export const runConversation = (ids: IdService): Conversation => ({
  id: ids.generate(),
  workspaceId: ids.generate(),
  agentId: ids.generate(),
  mode: ConversationMode.Live,
  channelKind: ChannelKind.Simulated,
  channelId: null,
  endUserExternalId: TEST_END_USER_EXTERNAL_ID,
  endUserName: TEST_END_USER_NAME,
  endUserLanguage: null,
  state: ConversationState.AgentActive,
  handledBy: null,
  activeRunId: null,
  simulationVersionId: null,
  awaySentAt: null,
  lastMessageAt: RUNS_TEST_START,
  lastCustomerMessageAt: null,
  lastEscalatedAt: null,
  closedAt: null,
  closeReason: null,
  createdAt: RUNS_TEST_START,
});

export const historyMessage = (
  conversation: Conversation,
  author: MessageAuthor,
  text: string,
): Message => ({
  id: text,
  workspaceId: conversation.workspaceId,
  conversationId: conversation.id,
  author,
  text,
  quickReplies: [],
  externalId: null,
  idempotencyKey: null,
  delivery: null,
  runId: null,
  createdAt: RUNS_TEST_START,
});

export const finishedStep = (
  ids: IdService,
  node: FlowNode,
  status: FinishedRunStepStatus,
  port: string | null,
): RunStep => ({
  id: ids.generate(),
  workspaceId: ids.generate(),
  runId: ids.generate(),
  nodeId: node.id,
  nodeKey: node.key,
  branchKey: ROOT_BRANCH_KEY,
  status,
  attempt: FIRST_STEP_ATTEMPT,
  input: {},
  output: status === RunStepStatus.Succeeded ? { answer: node.key } : null,
  port,
  error: null,
  startedAt: RUNS_TEST_START,
  finishedAt: RUNS_TEST_START,
});

export const handOffOnFailure = (flow: FlowDocument): FlowDocument => ({
  ...flow,
  settings: {
    ...flow.settings,
    onUnhandledFailure: {
      action: UnhandledFailureAction.Handoff,
      customerMessage: TEST_FAILURE_APOLOGY,
    },
  },
});
