import { IdPrefix } from '@agent-ic/contracts';
import type { FlowDocument } from '@agent-ic/flow';
import { expect, vi } from 'vitest';
import { AppModule } from '@/app/app.module';
import { APP_MODULES } from '@/app/constants/app-modules.constants';
import { createApplication } from '@/app/helpers/application.helpers';
import { AgentRuntimeReader, AgentVersionKind } from '@/modules/agents';
import type { PauseSettings } from '@/modules/agents';
import { AgentVersionsRepository } from '@/modules/agents/repositories/agent-versions.repository';
import { AgentsRepository } from '@/modules/agents/repositories/agents.repository';
import { SimulatedChannelAdapter } from '@/modules/channels';
import { IncomingMessagesService } from '@/modules/conversations';
import type { IncomingMessageInput, IncomingMessageResult } from '@/modules/conversations';
import { ConversationsRepository } from '@/modules/conversations/repositories/conversations.repository';
import { PromptFoldersRepository } from '@/modules/prompts/repositories/prompt-folders.repository';
import { PromptVersionsRepository } from '@/modules/prompts/repositories/prompt-versions.repository';
import { PromptsRepository } from '@/modules/prompts/repositories/prompts.repository';
import { UNFINISHED_RUN_STATUSES } from '@/modules/runs/constants/run.constants';
import { RunStepsRepository } from '@/modules/runs/repositories/run-steps.repository';
import { RunsRepository } from '@/modules/runs/repositories/runs.repository';
import { ClockService } from '@/platform/clock/services/clock.service';
import { EnvVar } from '@/platform/config/constants/env.constants';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { TracingService } from '@/platform/observability/services/tracing.service';
import { QueueName } from '@/platform/queues/constants/queue.constants';
import { QueuesService } from '@/platform/queues/services/queues.service';
import {
  PENDING_JOB_TYPES,
  RUNS_TEST_START,
  RUNS_WORKER_QUEUES,
  RUNS_WORKER_WAIT,
  TEST_LLM_API_KEY,
  TEST_PUBLISHED_NUMBER,
} from '@test/support/constants/runs-testing.constants';
import { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import { MissingTestDataError } from '@test/support/errors/missing-test-data.error';
import { newAgent, newVersion } from '@test/support/fixtures/agents.fixture';
import { incomingMessage, workspaceSystemCtx } from '@test/support/fixtures/conversation.fixture';
import { createIntegrationConfig } from '@test/support/fixtures/integration-env.fixture';
import { newFolder, newPrompt, newPromptVersion } from '@test/support/fixtures/prompts.fixture';
import { ensureWorkspaceRow } from '@test/support/helpers/parent-rows.helpers';
import type {
  RunsWorker,
  SettledConversation,
  WorkerAgent,
} from '@test/support/typedefs/runs-testing.typedefs';

export const createRunsWorker = async (
  llmBaseUrl: string,
  redisPrefix: TestRedisPrefix = TestRedisPrefix.RunsWorker,
): Promise<RunsWorker> => {
  const config = createIntegrationConfig(
    { role: Role.Worker, queues: Object.values(QueueName) },
    redisPrefix,
    { [EnvVar.LlmBaseUrl]: llmBaseUrl, [EnvVar.LlmApiKey]: TEST_LLM_API_KEY },
  );
  const tracing = new TracingService(config.telemetry);
  const app = await createApplication(config, AppModule.forRole(config, tracing, APP_MODULES));
  await app.init();
  return {
    app,
    ids: app.get(IdService),
    clock: app.get(ClockService),
    tenants: app.get(TenantTransactionService),
    agents: app.get(AgentsRepository),
    versions: app.get(AgentVersionsRepository),
    reader: app.get(AgentRuntimeReader),
    incoming: app.get(IncomingMessagesService),
    conversations: app.get(ConversationsRepository),
    runs: app.get(RunsRepository),
    steps: app.get(RunStepsRepository),
    simulated: app.get(SimulatedChannelAdapter),
    queues: app.get(QueuesService),
  };
};

export const seedWorkerAgent = async (
  worker: RunsWorker,
  flow: FlowDocument,
  published: boolean,
  pause: PauseSettings | null = null,
  workspaceId: string | null = null,
): Promise<WorkerAgent> => {
  const seededWorkspaceId = workspaceId ?? worker.ids.generate();
  const agentId = worker.ids.generate();
  const versionId = published ? worker.ids.generate() : null;
  const live = { kind: AgentVersionKind.Published, number: TEST_PUBLISHED_NUMBER };
  await ensureWorkspaceRow(worker.app, seededWorkspaceId);
  await worker.tenants.run(seededWorkspaceId, async () => {
    await worker.agents.insert(newAgent(agentId, seededWorkspaceId));
    await worker.versions.insert(
      newVersion(worker.ids.generate(), seededWorkspaceId, agentId, { flow }),
    );
    if (versionId !== null) {
      await worker.versions.insert(
        newVersion(versionId, seededWorkspaceId, agentId, {
          ...live,
          flow,
          publishedAt: RUNS_TEST_START,
        }),
      );
      await worker.agents.setLiveVersion(seededWorkspaceId, agentId, versionId);
    }
    await worker.agents.setPause(seededWorkspaceId, agentId, pause);
  });
  return { workspaceId: seededWorkspaceId, agentId, versionId };
};

export const seedWorkerPrompt = async (
  worker: RunsWorker,
  workspaceId: string,
  text: string,
): Promise<string> => {
  const suffix = worker.ids.generate();
  const folderId = worker.ids.generate();
  const promptId = worker.ids.generate();
  await ensureWorkspaceRow(worker.app, workspaceId);
  await worker.tenants.run(workspaceId, async () => {
    await worker.app
      .get(PromptFoldersRepository)
      .insert(newFolder(folderId, workspaceId, { name: `Folder ${suffix}` }));
    await worker.app
      .get(PromptsRepository)
      .insert(newPrompt(promptId, workspaceId, folderId, { name: `Prompt ${suffix}` }));
    await worker.app
      .get(PromptVersionsRepository)
      .insert(newPromptVersion(worker.ids.generate(), workspaceId, promptId, { text }));
  });
  return worker.ids.toPublic(IdPrefix.Prompt, promptId);
};

export const sendCustomerMessage = (
  worker: RunsWorker,
  { workspaceId, agentId }: WorkerAgent,
  overrides: Partial<IncomingMessageInput> = {},
): Promise<IncomingMessageResult> =>
  worker.incoming.handleIncomingMessage(
    workspaceSystemCtx(workspaceId),
    incomingMessage(workspaceId, agentId, overrides),
  );

export const readConversation = async (
  worker: RunsWorker,
  { workspaceId }: WorkerAgent,
  conversationId: string,
): Promise<SettledConversation> => {
  const state = await worker.tenants.run(workspaceId, async () => ({
    conversation: await worker.conversations.findById(workspaceId, conversationId),
    run: await worker.runs.findLatestByConversation(workspaceId, conversationId),
  }));
  if (state.conversation === null) {
    throw new MissingTestDataError(conversationId);
  }
  const sent = worker.simulated.transcript(conversationId).map(({ text }) => text);
  return { conversation: state.conversation, run: state.run, sent };
};

export const waitForIdleQueues = (worker: RunsWorker): Promise<void> =>
  vi.waitFor(async () => {
    for (const name of RUNS_WORKER_QUEUES) {
      const counts = await worker.queues.get(name).getJobCounts(...PENDING_JOB_TYPES);
      expect(Object.values(counts).every((count) => count === 0)).toBe(true);
    }
  }, RUNS_WORKER_WAIT);

export const settleConversation = async (
  worker: RunsWorker,
  agent: WorkerAgent,
  conversationId: string,
  sentCount: number,
): Promise<SettledConversation> => {
  await vi.waitFor(async () => {
    const { conversation, run, sent } = await readConversation(worker, agent, conversationId);
    expect(conversation.activeRunId).toBeNull();
    expect(UNFINISHED_RUN_STATUSES).not.toContain(run?.status);
    expect(sent).toHaveLength(sentCount);
  }, RUNS_WORKER_WAIT);
  await waitForIdleQueues(worker);
  const settled = await readConversation(worker, agent, conversationId);
  expect(settled.sent).toHaveLength(sentCount);
  return settled;
};
