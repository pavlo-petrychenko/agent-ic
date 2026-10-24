import { IdPrefix, Locale } from '@agent-ic/contracts';
import { NodeType } from '@agent-ic/flow';
import type { FlowDocument, FlowNode } from '@agent-ic/flow';
import { TransactionHost } from '@nestjs-cls/transactional';
import { eq, sql } from 'drizzle-orm';
import { AgentRuntimeReader } from '@/modules/agents';
import { AgentVersionKind, PauseMode } from '@/modules/agents/constants/agent.constants';
import { agentVersions } from '@/modules/agents/db/agent-versions.table';
import { AgentVersionsRepository } from '@/modules/agents/repositories/agent-versions.repository';
import { AgentsRepository } from '@/modules/agents/repositories/agents.repository';
import {
  ConversationMode,
  ConversationRunsService,
  MessageAuthor,
  messageReceivedEvent,
} from '@/modules/conversations';
import type { MessageReceivedPayload } from '@/modules/conversations';
import { ConversationsRepository } from '@/modules/conversations/repositories/conversations.repository';
import { MessagesRepository } from '@/modules/conversations/repositories/messages.repository';
import type { NewMessage } from '@/modules/conversations/typedefs/message.typedefs';
import { SYSTEM_ROLES } from '@/modules/identity/constants/role.constants';
import { memberships } from '@/modules/identity/db/memberships.table';
import { rolePermissions } from '@/modules/identity/db/role-permissions.table';
import { roles } from '@/modules/identity/db/roles.table';
import { users } from '@/modules/identity/db/users.table';
import { workspaces } from '@/modules/identity/db/workspaces.table';
import { defaultPermissionsFor } from '@/modules/identity/helpers/role-permission.helpers';
import { runStepsChannel } from '@/modules/runs/channels/run-steps.channel';
import { ROOT_BRANCH_KEY, STEP_EXECUTORS } from '@/modules/runs/constants/run.constants';
import type { RunStepStatus } from '@/modules/runs/constants/run.constants';
import { startRunOnMessageJob } from '@/modules/runs/jobs/start-run-on-message.job';
import { RunStepsRepository } from '@/modules/runs/repositories/run-steps.repository';
import { RunsRepository } from '@/modules/runs/repositories/runs.repository';
import { RunsModule } from '@/modules/runs/runs.module';
import { AgentExecutor } from '@/modules/runs/services/agent-executor.service';
import { ApiRequestExecutor } from '@/modules/runs/services/api-request-executor.service';
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
import { SystemDatabaseService } from '@/platform/database/services/system-database.service';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';
import { DomainEventsModule } from '@/platform/domain-events/domain-events.module';
import { DomainEventsService } from '@/platform/domain-events/services/domain-events.service';
import { IdService } from '@/platform/ids/services/id.service';
import { channelFor } from '@/platform/live-updates/helpers/channel.helpers';
import { LiveUpdatesModule } from '@/platform/live-updates/live-updates.module';
import { LiveUpdatesService } from '@/platform/live-updates/services/live-updates.service';
import { LLM_STEP_TIMEOUT_MS } from '@/platform/llm/constants/llm-gateway.constants';
import type { LlmGateway } from '@/platform/llm/gateways/llm.gateway';
import { LlmTraceContextService } from '@/platform/llm/services/llm-trace-context.service';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { NodeOutboundHttpGateway } from '@/platform/outbound-http/gateways/node-outbound-http.gateway';
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
  TEST_AGENT_REPLY,
  TEST_MEMBER_EMAIL_DOMAIN,
  TEST_MEMBER_PASSWORD_HASH,
  TEST_PUBLISHED_NUMBER,
  TEST_REPUBLISHED_NUMBER,
} from '@test/support/constants/runs-testing.constants';
import { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import { TEST_TIME_ZONE } from '@test/support/constants/workspace-testing.constants';
import { MissingTestDataError } from '@test/support/errors/missing-test-data.error';
import { ManualClock } from '@test/support/fakes/manual-clock.fake';
import { ScriptedStepExecutor } from '@test/support/fakes/scripted-step-executor.fake';
import { newAgent, newVersion } from '@test/support/fixtures/agents.fixture';
import {
  newConversation,
  newMessage,
  workspaceSystemCtx,
} from '@test/support/fixtures/conversation.fixture';
import { newRun, newRunStep, triggerOnlyFlow } from '@test/support/fixtures/runs.fixture';
import { seedPublishedVersion } from '@test/support/helpers/agents-testing.helpers';
import { queuedEventsFor } from '@test/support/helpers/conversations-testing.helpers';
import { createPlatformTestingModule } from '@test/support/helpers/database-testing.helpers';
import {
  createLlmGateway,
  createLlmTraceContextService,
} from '@test/support/helpers/llm-testing.helpers';
import { ensureRunParents, ensureWorkspaceRow } from '@test/support/helpers/parent-rows.helpers';
import { AgentsNeighboursModule } from '@test/support/modules/agents-neighbours.module';
import { LlmTracesProbeModule } from '@test/support/modules/llm-traces-probe.module';
import { UsageNeighboursModule } from '@test/support/modules/usage-neighbours.module';
import type {
  ExecutableRun,
  LastRunBatch,
  LifecycleState,
  LiveConversation,
  ReceivedMessage,
  RunExecutionTestbed,
  RunChat,
  RunBatch,
  RunLifecycleTestbed,
  RunsTestbed,
  SeededMember,
  StepWatch,
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
  const completion = new CompletionExecutor(gateway, new IdService(clock));
  const agent = new AgentExecutor(gateway, new IdService(clock));
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
      UsageNeighboursModule.forRole(ROLE),
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
          new ApiRequestExecutor(new NodeOutboundHttpGateway(clock, []), clock),
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
  await ensureRunParents(testbed.module, run);
  await testbed.tenants.run(workspaceId, () => testbed.runs.insert(run));
  return run;
};

export const seedExecutableRun = async (
  testbed: RunExecutionTestbed,
  flow: FlowDocument,
  earlier: readonly Pick<NewMessage, 'author' | 'text'>[] = [],
  mode: ConversationMode = ConversationMode.Live,
  workspaceId: string | null = null,
): Promise<ExecutableRun> => {
  const seededWorkspaceId = workspaceId ?? testbed.ids.generate();
  await ensureWorkspaceRow(testbed.module, seededWorkspaceId);
  const conversation = { ...newConversation(testbed, seededWorkspaceId), mode };
  const history = earlier.map((overrides) => {
    const seededMessage = newMessage(testbed, conversation, overrides);
    testbed.clock.advanceBy(MESSAGE_SPACING_MS);
    return seededMessage;
  });
  const message = newMessage(testbed, conversation);
  const { agentId } = conversation;
  const run: NewRun = {
    ...newRun(testbed, seededWorkspaceId),
    mode,
    conversationId: conversation.id,
    agentId,
    lastCoveredMessageId: message.id,
  };
  const version = newVersion(run.versionId, seededWorkspaceId, agentId, {
    flow,
    kind: AgentVersionKind.Published,
    number: TEST_PUBLISHED_NUMBER,
    publishedAt: RUNS_TEST_START,
  });
  await testbed.tenants.run(seededWorkspaceId, async () => {
    await testbed.module.get(AgentsRepository).insert(newAgent(agentId, seededWorkspaceId));
    await testbed.module.get(AgentVersionsRepository).insert(version);
    await testbed.module.get(ConversationsRepository).insert(conversation);
    for (const seededMessage of [...history, message]) {
      await testbed.module.get(MessagesRepository).insertIfAbsent(seededMessage);
    }
    await testbed.runs.insert(run);
  });
  return { run, ctx: workspaceSystemCtx(seededWorkspaceId) };
};

export const watchStep = async (
  testbed: RunExecutionTestbed,
  { run }: ExecutableRun,
  nodeId: string,
  status: RunStepStatus,
): Promise<StepWatch> => {
  const events = await testbed.liveUpdates.subscribe(channelFor(runStepsChannel, run.id));
  const reached = (async () => {
    for await (const event of events) {
      if (event.nodeId === nodeId && event.status === status) {
        return;
      }
    }
  })();
  return { reached };
};

export const storeFlowJson = async (
  testbed: RunExecutionTestbed,
  { run }: ExecutableRun,
  flow: unknown,
): Promise<void> => {
  const txHost = testbed.module.get<TransactionHost<AppTransactionAdapter>>(TransactionHost);
  await testbed.tenants.run(run.workspaceId, async () => {
    await txHost.tx
      .update(agentVersions)
      .set({ flow: sql`${JSON.stringify(flow)}::jsonb` })
      .where(eq(agentVersions.id, run.versionId));
  });
};

export const seedSimulationRun = (testbed: RunExecutionTestbed): Promise<ExecutableRun> =>
  seedExecutableRun(testbed, triggerOnlyFlow(), [], ConversationMode.Simulation);

export const seedSimulationRunBatch = async (
  testbed: RunExecutionTestbed,
  flow: FlowDocument,
): Promise<RunBatch> => {
  const { run, ctx } = await seedExecutableRun(testbed, flow, [], ConversationMode.Simulation);
  const { workspaceId } = run;
  await testbed.execution.execute(ctx, workspaceId, run.id);
  const oneStep = { ...run, id: testbed.ids.generate() };
  const noSteps = { ...run, id: testbed.ids.generate() };
  await testbed.tenants.run(workspaceId, async () => {
    await testbed.runs.insert(oneStep);
    await testbed.runs.insert(noSteps);
    await testbed.steps.start(newRunStep(testbed, oneStep));
    await testbed.module.get(ConversationRunsService).recordOutbound(ctx, {
      workspaceId,
      conversationId: run.conversationId,
      key: testbed.ids.generate(),
      author: MessageAuthor.Agent,
      text: TEST_AGENT_REPLY,
      quickReplies: [],
      runId: run.id,
    });
  });
  const publicId = (id: string): string => testbed.ids.toPublic(IdPrefix.Run, id);
  return {
    workspaceId,
    runIds: {
      executed: publicId(run.id),
      started: publicId(oneStep.id),
      queued: publicId(noSteps.id),
    },
  };
};

export const seedLastSimulationRuns = async (
  testbed: RunExecutionTestbed,
  draftRevision: number,
): Promise<LastRunBatch> => {
  const { run } = await seedSimulationRun(testbed);
  const { workspaceId, agentId } = run;
  const draft = { kind: AgentVersionKind.Draft, number: null, revision: draftRevision };
  await seedPublishedVersion(testbed.module, workspaceId, agentId, draft);
  testbed.clock.advanceBy(MESSAGE_SPACING_MS);
  const published = { ...run, id: testbed.ids.generate(), agentId: testbed.ids.generate() };
  const neverTested = testbed.ids.generate();
  const testedRunId = testbed.ids.generate();
  await testbed.tenants.run(workspaceId, async () => {
    const agents = testbed.module.get(AgentsRepository);
    await agents.insert(newAgent(published.agentId, workspaceId));
    await agents.insert(newAgent(neverTested, workspaceId));
    await testbed.runs.insert(published);
    const snapshot = await testbed.module
      .get(AgentRuntimeReader)
      .snapshotDraft(workspaceId, agentId);
    await testbed.runs.insert({ ...run, id: testedRunId, versionId: snapshot.id });
  });
  return {
    workspaceId,
    agentIds: [agentId, published.agentId, neverTested].map((id) =>
      testbed.ids.toPublic(IdPrefix.Agent, id),
    ),
    testedRunId: testbed.ids.toPublic(IdPrefix.Run, testedRunId),
    publishedRunId: testbed.ids.toPublic(IdPrefix.Run, published.id),
  };
};

export const seedWorkspaceMembers = async (
  testbed: RunExecutionTestbed,
  workspaceId: string,
  members: readonly SeededMember[],
): Promise<string[]> => {
  const { db } = testbed.module.get(SystemDatabaseService);
  const now = testbed.clock.now();
  const rows = members.map((member) => ({ ...member, userId: testbed.ids.generate() }));
  await db.insert(users).values(
    rows.map(({ userId, name }) => ({
      id: userId,
      email: `${userId}@${TEST_MEMBER_EMAIL_DOMAIN}`,
      name,
      passwordHash: TEST_MEMBER_PASSWORD_HASH,
      locale: Locale.En,
      createdAt: now,
      updatedAt: now,
    })),
  );
  const [creator] = rows;
  if (creator === undefined) {
    throw new MissingTestDataError(workspaceId);
  }
  await db
    .insert(workspaces)
    .values({
      id: workspaceId,
      workspaceId,
      name: workspaceId,
      timeZone: TEST_TIME_ZONE,
      createdByUserId: creator.userId,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing();
  const seededRoles = SYSTEM_ROLES.map((key) => ({
    id: testbed.ids.generate(),
    workspaceId,
    key,
    name: null,
    isSystem: true,
    createdAt: now,
    updatedAt: now,
  }));
  await db.insert(roles).values(seededRoles);
  await db.insert(rolePermissions).values(
    seededRoles.flatMap((role) =>
      defaultPermissionsFor(role.key).map((permission) => ({
        id: testbed.ids.generate(),
        workspaceId,
        roleId: role.id,
        resource: permission.resource,
        action: permission.action,
      })),
    ),
  );
  const roleIdByKey = new Map(seededRoles.map((role) => [role.key, role.id]));
  await db.insert(memberships).values(
    rows.map(({ userId, role }) => {
      const roleId = roleIdByKey.get(role);
      if (roleId === undefined) {
        throw new MissingTestDataError(role);
      }
      return {
        id: testbed.ids.generate(),
        workspaceId,
        userId,
        roleId,
        createdAt: now,
      };
    }),
  );
  return rows.map(({ userId }) => userId);
};

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
    await agents.setLiveVersion(workspaceId, agentId, versionId);
  });
  return versionId;
};

export const seedLiveConversation = async (
  testbed: RunExecutionTestbed,
  flow: FlowDocument,
): Promise<LiveConversation> => {
  const workspaceId = testbed.ids.generate();
  const conversation = newConversation(testbed, workspaceId);
  await ensureWorkspaceRow(testbed.module, workspaceId);
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
    [AgentChange.PauseWithAwayMessage]: () => agents.setPause(workspaceId, agentId, pause),
    [AgentChange.Unpublish]: () => agents.setLiveVersion(workspaceId, agentId, null),
    [AgentChange.Delete]: () => agents.delete(workspaceId, agentId, at),
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
  const scope = { variables, history: [], today: RUNS_TEST_START, prompts: new Map() };
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
