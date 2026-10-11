import { DEFAULT_RETRIEVAL_MODE, EscalationMode, NodeType, PortName } from '@agent-ic/flow';
import type { AgentNode, EscalationNode, FlowDocument, FlowEdge, FlowNode } from '@agent-ic/flow';
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
import { TEST_END_USER_EXTERNAL_ID } from '@test/support/constants/conversations-testing.constants';
import {
  RUNS_TEST_START,
  TEST_END_USER_NAME,
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

export const flowEdge = (
  source: string,
  target: string,
  port: string = PortName.Next,
): FlowEdge => ({
  id: `${source}:${port}`,
  source,
  sourcePort: port,
  target,
});

export const stepFlow = (nodes: readonly FlowNode[], edges: readonly FlowEdge[]): FlowDocument => {
  const trigger = triggerFlow();
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
