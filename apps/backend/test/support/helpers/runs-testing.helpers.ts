import { NodeType } from '@agent-ic/flow';
import type { FlowDocument, FlowNode } from '@agent-ic/flow';
import { AgentVersionKind, PauseMode } from '@/modules/agents/constants/agent.constants';
import { AgentVersionsRepository } from '@/modules/agents/repositories/agent-versions.repository';
import { AgentsRepository } from '@/modules/agents/repositories/agents.repository';
import { ConversationMode, messageReceivedEvent } from '@/modules/conversations';
import type { MessageReceivedPayload } from '@/modules/conversations';
import { ConversationsRepository } from '@/modules/conversations/repositories/conversations.repository';
import { MessagesRepository } from '@/modules/conversations/repositories/messages.repository';
import type { NewMessage } from '@/modules/conversations/typedefs/message.typedefs';
import { ROOT_BRANCH_KEY, STEP_EXECUTORS } from '@/modules/runs/constants/run.constants';
import { startRunOnMessageJob } from '@/modules/runs/jobs/start-run-on-message.job';
import { RunStepsRepository } from '@/modules/runs/repositories/run-steps.repository';
import { RunsRepository } from '@/modules/runs/repositories/runs.repository';
import { RunsModule } from '@/modules/runs/runs.module';
import { AgentExecutor } from '@/modules/runs/services/agent-executor.service';
import { CompletionExecutor } from '@/modules/runs/services/completion-executor.service';
import { MessageTriggerExecutor } from '@/modules/runs/services/message-trigger-executor.service';
import { ParallelExecutor } from '@/modules/runs/services/parallel-executor.service';
import { RouterExecutor } from '@/modules/runs/services/router-executor.service';
import { RunExecutionService } from '@/modules/runs/services/run-execution.service';
import type { StepData } from '@/modules/runs/typedefs/run-step.typedefs';
import type { NewRun, Run } from '@/modules/runs/typedefs/run.typedefs';
import type { StepExecution } from '@/modules/runs/typedefs/step-executor.typedefs';
import { ExecuteRunUseCase } from '@/modules/runs/use-cases/execute-run.use-case';
import { ClockService } from '@/platform/clock/services/clock.service';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { DomainEventsModule } from '@/platform/domain-events/domain-events.module';
import { DomainEventsService } from '@/platform/domain-events/services/domain-events.service';
import { IdService } from '@/platform/ids/services/id.service';
import { LiveUpdatesModule } from '@/platform/live-updates/live-updates.module';
import { LiveUpdatesService } from '@/platform/live-updates/services/live-updates.service';
import { LLM_STEP_TIMEOUT_MS } from '@/platform/llm/constants/llm-gateway.constants';
import type { LlmGateway } from '@/platform/llm/gateways/llm.gateway';
import { LlmTraceContextService } from '@/platform/llm/services/llm-trace-context.service';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { OutboundHttpModule } from '@/platform/outbound-http/outbound-http.module';
import { QueuesModule } from '@/platform/queues/queues.module';
import { JobHandlersService } from '@/platform/queues/services/job-handlers.service';
import { QueuesService } from '@/platform/queues/services/queues.service';
import { RateLimitModule } from '@/platform/rate-limit/rate-limit.module';
import { RedisModule } from '@/platform/redis/redis.module';
import { TEST_AWAY_MESSAGE } from '@test/support/constants/agents-testing.constants';
import { MESSAGE_SPACING_MS } from '@test/support/constants/conversations-testing.constants';
import {
  AgentChange,
  RUNS_TEST_START,
  TEST_PUBLISHED_NUMBER,
  TEST_REPUBLISHED_NUMBER,
} from '@test/support/constants/runs-testing.constants';
import { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import { MissingTestDataError } from '@test/support/errors/missing-test-data.error';
import { ManualClock } from '@test/support/fakes/manual-clock.fake';
import { ScriptedStepExecutor } from '@test/support/fakes/scripted-step-executor.fake';
import { newAgent, newVersion } from '@test/support/fixtures/agents.fixture';
import {
  newConversation,
  newMessage,
  workspaceSystemCtx,
} from '@test/support/fixtures/conversation.fixture';
import { newRun, triggerOnlyFlow } from '@test/support/fixtures/runs.fixture';
import { queuedEventsFor } from '@test/support/helpers/conversations-testing.helpers';
import { createPlatformTestingModule } from '@test/support/helpers/database-testing.helpers';
import {
  createLlmGateway,
  createLlmTraceContextService,
} from '@test/support/helpers/llm-testing.helpers';
import { AgentsNeighboursModule } from '@test/support/modules/agents-neighbours.module';
import { LlmTracesProbeModule } from '@test/support/modules/llm-traces-probe.module';
import type {
  ExecutableRun,
  LifecycleState,
  LiveConversation,
  ReceivedMessage,
  RunExecutionTestbed,
  RunChat,
  RunLifecycleTestbed,
  RunsTestbed,
} from '@test/support/typedefs/runs-testing.typedefs';

const ROLE = Role.Worker;

export const createRunsTestbed = async (
  redisPrefix: TestRedisPrefix = TestRedisPrefix.Runs,
  llm: LlmGateway | null = null,
  scriptedNodeType: NodeType = NodeType.Agent,
  traces: LlmTraceContextService = createLlmTraceContextService({}),
): Promise<RunExecutionTestbed> => {
  const clock = new ManualClock(RUNS_TEST_START);
  const executor = new ScriptedStepExecutor(scriptedNodeType);
  const observer = new ScriptedStepExecutor(NodeType.Completion);
  const gateway = llm ?? createLlmGateway({}, LLM_STEP_TIMEOUT_MS);
  const completion = new CompletionExecutor(gateway);
  const agent = new AgentExecutor(gateway);
  const llmSteps = llm === null ? [observer] : [completion, agent];
  const module = await createPlatformTestingModule(
    redisPrefix,
    [
      QueuesModule.forRole(ROLE),
      DomainEventsModule.forRole(ROLE),
      LiveUpdatesModule.forRole(ROLE),
      RedisModule,
      RateLimitModule,
      LlmTracesProbeModule.forRole(ROLE),
      OutboundHttpModule,
      AgentsNeighboursModule.forRole(ROLE),
      RunsModule.forRole(ROLE),
    ],
    [
      { token: ClockService, value: clock },
      { token: LlmTraceContextService, value: traces },
      { token: CompletionExecutor, value: completion },
      { token: AgentExecutor, value: agent },
      {
        token: STEP_EXECUTORS,
        value: [
          new MessageTriggerExecutor(),
          new RouterExecutor(),
          new ParallelExecutor(),
          ...llmSteps,
          executor,
          new ScriptedStepExecutor(NodeType.Escalation),
        ],
      },
    ],
  );
  return {
    module,
    clock,
    executor,
    observer,
    ids: module.get(IdService),
    tenants: module.get(TenantTransactionService),
    runs: module.get(RunsRepository),
    steps: module.get(RunStepsRepository),
    execution: module.get(RunExecutionService),
    liveUpdates: module.get(LiveUpdatesService),
  };
};

export const seedRun = async (
  testbed: RunsTestbed,
  workspaceId: string = testbed.ids.generate(),
): Promise<NewRun> => {
  const run = newRun(testbed, workspaceId);
  await testbed.tenants.run(workspaceId, () => testbed.runs.insert(run));
  return run;
};

export const seedExecutableRun = async (
  testbed: RunExecutionTestbed,
  flow: FlowDocument,
  earlier: readonly Pick<NewMessage, 'author' | 'text'>[] = [],
  mode: ConversationMode = ConversationMode.Live,
): Promise<ExecutableRun> => {
  const workspaceId = testbed.ids.generate();
  const conversation = { ...newConversation(testbed, workspaceId), mode };
  const history = earlier.map((overrides) => {
    const seededMessage = newMessage(testbed, conversation, overrides);
    testbed.clock.advanceBy(MESSAGE_SPACING_MS);
    return seededMessage;
  });
  const message = newMessage(testbed, conversation);
  const { agentId } = conversation;
  const run: NewRun = {
    ...newRun(testbed, workspaceId),
    mode,
    conversationId: conversation.id,
    agentId,
    lastCoveredMessageId: message.id,
  };
  const version = newVersion(run.versionId, workspaceId, agentId, {
    flow,
    kind: AgentVersionKind.Published,
    number: TEST_PUBLISHED_NUMBER,
    publishedAt: RUNS_TEST_START,
  });
  await testbed.tenants.run(workspaceId, async () => {
    await testbed.module.get(AgentsRepository).insert(newAgent(agentId, workspaceId));
    await testbed.module.get(AgentVersionsRepository).insert(version);
    await testbed.module.get(ConversationsRepository).insert(conversation);
    for (const seededMessage of [...history, message]) {
      await testbed.module.get(MessagesRepository).insertIfAbsent(seededMessage);
    }
    await testbed.runs.insert(run);
  });
  return { run, ctx: workspaceSystemCtx(workspaceId) };
};

export const seedSimulationRun = (testbed: RunExecutionTestbed): Promise<ExecutableRun> =>
  seedExecutableRun(testbed, triggerOnlyFlow(), [], ConversationMode.Simulation);

export const createRunLifecycleTestbed = async (
  redisPrefix: TestRedisPrefix,
): Promise<RunLifecycleTestbed> => {
  const testbed = await createRunsTestbed(redisPrefix);
  return {
    ...testbed,
    executeRun: testbed.module.get(ExecuteRunUseCase),
    queues: testbed.module.get(QueuesService),
  };
};

export const republish = async (
  testbed: RunExecutionTestbed,
  { conversation }: Pick<LiveConversation, 'conversation'>,
  flow: FlowDocument,
  number: number = TEST_REPUBLISHED_NUMBER,
): Promise<string> => {
  const { workspaceId, agentId } = conversation;
  const versionId = testbed.ids.generate();
  const version = { flow, kind: AgentVersionKind.Published, number, publishedAt: RUNS_TEST_START };
  await testbed.tenants.run(workspaceId, async () => {
    const versions = testbed.module.get(AgentVersionsRepository);
    await versions.insert(newVersion(versionId, workspaceId, agentId, version));
    const agents = testbed.module.get(AgentsRepository);
    await agents.setLiveVersion(workspaceId, agentId, versionId, testbed.clock.now());
  });
  return versionId;
};

export const seedLiveConversation = async (
  testbed: RunExecutionTestbed,
  flow: FlowDocument,
): Promise<LiveConversation> => {
  const workspaceId = testbed.ids.generate();
  const conversation = newConversation(testbed, workspaceId);
  await testbed.tenants.run(workspaceId, async () => {
    await testbed.module.get(AgentsRepository).insert(newAgent(conversation.agentId, workspaceId));
    await testbed.module.get(ConversationsRepository).insert(conversation);
  });
  const versionId = await republish(testbed, { conversation }, flow, TEST_PUBLISHED_NUMBER);
  return { conversation, versionId, ctx: workspaceSystemCtx(workspaceId) };
};

export const changeAgent = async (
  testbed: RunExecutionTestbed,
  { conversation }: LiveConversation,
  change: AgentChange,
): Promise<void> => {
  const { workspaceId, agentId } = conversation;
  const agents = testbed.module.get(AgentsRepository);
  const at = testbed.clock.now();
  const pause = { mode: PauseMode.AwayMessage, awayMessage: TEST_AWAY_MESSAGE, pausedAt: at };
  const changes: Readonly<Record<AgentChange, () => Promise<unknown>>> = {
    [AgentChange.PauseWithAwayMessage]: () => agents.setPause(workspaceId, agentId, pause, at),
    [AgentChange.Unpublish]: () => agents.setLiveVersion(workspaceId, agentId, null, at),
    [AgentChange.Delete]: () => agents.delete(workspaceId, agentId),
  };
  await testbed.tenants.run(workspaceId, changes[change]);
};

export const receiveMessage = async (
  testbed: RunLifecycleTestbed,
  seeded: LiveConversation,
  pinned: Partial<Pick<MessageReceivedPayload, 'versionId'>> = {},
): Promise<ReceivedMessage> => {
  const { conversation, ctx } = seeded;
  const { id: conversationId, agentId, mode } = conversation;
  testbed.clock.advanceBy(MESSAGE_SPACING_MS);
  const message = newMessage(testbed, conversation);
  const event = { conversationId, messageId: message.id, agentId, mode, ...pinned };
  await testbed.tenants.run(conversation.workspaceId, async () => {
    await testbed.module.get(MessagesRepository).insertIfAbsent(message);
    await testbed.module.get(DomainEventsService).emit(ctx, messageReceivedEvent, event);
  });
  const { queue, name } = startRunOnMessageJob;
  const listener = testbed.module.get(JobHandlersService).find(queue, name);
  const queued = await queuedEventsFor(testbed, startRunOnMessageJob, conversationId);
  for (const data of queued.filter((queuedEvent) => queuedEvent['messageId'] === message.id)) {
    await listener?.handler.handle(ctx, data);
  }
  const { latest } = await readLifecycle(testbed, seeded);
  return { message, run: latest?.lastCoveredMessageId === message.id ? latest : null };
};

export const readLifecycle = (
  testbed: RunLifecycleTestbed,
  { conversation: { workspaceId, id } }: LiveConversation,
): Promise<LifecycleState> =>
  testbed.tenants.run(workspaceId, async () => ({
    conversation: await testbed.module.get(ConversationsRepository).findById(workspaceId, id),
    latest: await testbed.runs.findLatestByConversation(workspaceId, id),
  }));

export const stepExecutionOf = async <TNode extends FlowNode>(
  testbed: RunExecutionTestbed,
  { run, ctx }: ExecutableRun,
  node: TNode,
  variables: StepData,
): Promise<StepExecution<TNode>> => {
  const stored = await testbed.tenants.run(run.workspaceId, () =>
    testbed.runs.findById(run.workspaceId, run.id),
  );
  if (stored === null) {
    throw new MissingTestDataError(run.id);
  }
  const scope = { variables, history: [], today: RUNS_TEST_START };
  return { ctx, run: stored, node, branchKey: ROOT_BRANCH_KEY, scope };
};

export const readRunChat = (
  testbed: RunExecutionTestbed,
  { workspaceId, conversationId }: Pick<Run, 'workspaceId' | 'conversationId'>,
  messageIds: unknown,
): Promise<RunChat> =>
  testbed.tenants.run(workspaceId, async () => ({
    conversation: await testbed.module
      .get(ConversationsRepository)
      .findById(workspaceId, conversationId),
    messages: await Promise.all(
      (Array.isArray(messageIds) ? messageIds : []).map((id) =>
        testbed.module.get(MessagesRepository).findById(workspaceId, String(id)),
      ),
    ),
  }));
