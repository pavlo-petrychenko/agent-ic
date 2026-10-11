import {
  CompletionRole,
  ConditionOperator,
  DEFAULT_RETRIEVAL_MODE,
  EscalationMode,
  FailureMode,
  HttpMethod,
  MessageContentKind,
  NodeType,
  NotifyChannel,
  OutputFieldType,
  PortName,
  QuickRepliesKind,
  RecipientsKind,
  RequestAuthKind,
  RequestBodyKind,
  RuleMatch,
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
import type {
  FinishedRunStepStatus,
  NewRunStep,
  RunStep,
} from '@/modules/runs/typedefs/run-step.typedefs';
import type { NewRun } from '@/modules/runs/typedefs/run.typedefs';
import type { IdService } from '@/platform/ids/services/id.service';
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
  RUNS_TEST_START,
  SEND_NODE_ID,
  SEND_NODE_KEY,
  TEST_CUSTOMER_NOTICE,
  TEST_ESCALATION_REASON,
  TEST_QUICK_REPLIES,
  TEST_REPLIES_VARIABLE,
  TEST_END_USER_NAME,
  TEST_ROUTE_RULE_ID,
  TEST_STEP_INPUT,
  TEST_STEP_NODE_ID,
  TEST_STEP_NODE_KEY,
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
  createdAt: RUNS_TEST_START,
});

export const newRunStep = (
  testbed: RunsTestbed,
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

export const agentNode = (id: string, key: string): AgentNode => ({
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
  },
});

export const observerNode = (id: string, key: string): CompletionNode => ({
  id,
  key,
  label: key,
  position: NODE_POSITION,
  type: NodeType.Completion,
  config: {
    role: CompletionRole.Observer,
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

export const escalateNode = (): EscalationNode => ({
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
      recipients: { kind: RecipientsKind.Operators },
      channels: [NotifyChannel.InPlatform],
    },
    reminderAfterMinutes: null,
    fallbackAfterMinutes: null,
    fallbackMessage: TEST_CUSTOMER_NOTICE,
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

export const triggerOnlyFlow = (): FlowDocument => {
  const trigger = triggerFlow();
  return {
    ...trigger,
    nodes: trigger.nodes.filter((node) => node.type === NodeType.TriggerMessage),
    edges: [],
  };
};

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
  state: ConversationState.AgentActive,
  handledBy: null,
  activeRunId: null,
  awaySentAt: null,
  lastMessageAt: RUNS_TEST_START,
  closedAt: null,
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
