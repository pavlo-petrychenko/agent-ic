import { NodeType } from '@agent-ic/flow';
import type { FlowDocument } from '@agent-ic/flow';
import { AgentVersionKind } from '@/modules/agents/constants/agent.constants';
import { AgentVersionsRepository } from '@/modules/agents/repositories/agent-versions.repository';
import { AgentsRepository } from '@/modules/agents/repositories/agents.repository';
import { ConversationsRepository } from '@/modules/conversations/repositories/conversations.repository';
import { MessagesRepository } from '@/modules/conversations/repositories/messages.repository';
import { STEP_EXECUTORS } from '@/modules/runs/constants/run.constants';
import { RunStepsRepository } from '@/modules/runs/repositories/run-steps.repository';
import { RunsRepository } from '@/modules/runs/repositories/runs.repository';
import { RunsModule } from '@/modules/runs/runs.module';
import { MessageTriggerExecutor } from '@/modules/runs/services/message-trigger-executor.service';
import { RunExecutionService } from '@/modules/runs/services/run-execution.service';
import type { NewRun } from '@/modules/runs/typedefs/run.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { DomainEventsModule } from '@/platform/domain-events/domain-events.module';
import { IdService } from '@/platform/ids/services/id.service';
import { LiveUpdatesModule } from '@/platform/live-updates/live-updates.module';
import { LiveUpdatesService } from '@/platform/live-updates/services/live-updates.service';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { QueuesModule } from '@/platform/queues/queues.module';
import {
  RUNS_TEST_START,
  TEST_PUBLISHED_NUMBER,
} from '@test/support/constants/runs-testing.constants';
import { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import { ManualClock } from '@test/support/fakes/manual-clock.fake';
import { ScriptedStepExecutor } from '@test/support/fakes/scripted-step-executor.fake';
import { newAgent, newVersion } from '@test/support/fixtures/agents.fixture';
import {
  newConversation,
  newMessage,
  workspaceSystemCtx,
} from '@test/support/fixtures/conversation.fixture';
import { newRun } from '@test/support/fixtures/runs.fixture';
import { createPlatformTestingModule } from '@test/support/helpers/database-testing.helpers';
import type {
  ExecutableRun,
  RunExecutionTestbed,
  RunsTestbed,
} from '@test/support/typedefs/runs-testing.typedefs';

const ROLE = Role.Worker;

export const createRunsTestbed = async (
  redisPrefix: TestRedisPrefix = TestRedisPrefix.Runs,
): Promise<RunExecutionTestbed> => {
  const clock = new ManualClock(RUNS_TEST_START);
  const executor = new ScriptedStepExecutor(NodeType.Agent);
  const module = await createPlatformTestingModule(
    redisPrefix,
    [
      QueuesModule.forRole(ROLE),
      DomainEventsModule.forRole(ROLE),
      LiveUpdatesModule.forRole(ROLE),
      RunsModule.forRole(ROLE),
    ],
    [
      { token: ClockService, value: clock },
      { token: STEP_EXECUTORS, value: [new MessageTriggerExecutor(), executor] },
    ],
  );
  return {
    module,
    clock,
    executor,
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
): Promise<ExecutableRun> => {
  const workspaceId = testbed.ids.generate();
  const conversation = newConversation(testbed, workspaceId);
  const message = newMessage(testbed, conversation);
  const { agentId } = conversation;
  const run: NewRun = {
    ...newRun(testbed, workspaceId),
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
    await testbed.module.get(MessagesRepository).insertIfAbsent(message);
    await testbed.runs.insert(run);
  });
  return { run, ctx: workspaceSystemCtx(workspaceId) };
};
