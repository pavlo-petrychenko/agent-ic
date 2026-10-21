import { IdPrefix, Locale } from '@agent-ic/contracts';
import type { WorkspaceRole } from '@agent-ic/contracts';
import type { FlowDocument } from '@agent-ic/flow';
import { createClient } from 'graphql-ws';
import { expect, vi } from 'vitest';
import WebSocket from 'ws';
import { APP_MODULES } from '@/app/constants/app-modules.constants';
import { AgentVersionsRepository } from '@/modules/agents/repositories/agent-versions.repository';
import { ConversationMode } from '@/modules/conversations';
import { MembershipsRepository } from '@/modules/identity/repositories/memberships.repository';
import { UsersRepository } from '@/modules/identity/repositories/users.repository';
import { WorkspaceRolesService } from '@/modules/identity/services/workspace-roles.service';
import { CreateWorkspaceUseCase } from '@/modules/identity/use-cases/create-workspace.use-case';
import { ROOT_BRANCH_KEY, RunStepStatus, runStepsChannel } from '@/modules/runs';
import { RunStepsRepository } from '@/modules/runs/repositories/run-steps.repository';
import { RunsRepository } from '@/modules/runs/repositories/runs.repository';
import { AccessTokenService } from '@/platform/context/services/access-token.service';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { ConnectionParam } from '@/platform/graphql-server/constants/connection-param.constants';
import { IdService } from '@/platform/ids/services/id.service';
import { channelFor } from '@/platform/live-updates/helpers/channel.helpers';
import { LiveUpdatesService } from '@/platform/live-updates/services/live-updates.service';
import { RedisConnectionName } from '@/platform/redis/constants/redis.constants';
import {
  closeRedisConnection,
  createRedisConnection,
  withRedisKeyPrefix,
} from '@/platform/redis/helpers/redis.helpers';
import { TEST_EDITOR_ID } from '@test/support/constants/agents-testing.constants';
import {
  RUN_STEPS_SUBSCRIPTION,
  SUBSCRIBERS_REPLY_COUNT_INDEX,
  TEST_STEP_NODE_PREFIX,
  TEST_MEMBER_NAME,
  TEST_MEMBER_PASSWORD_HASH,
} from '@test/support/constants/graphql-subscriptions.constants';
import {
  API_ROLE_SELECTION,
  EPHEMERAL_PORT,
  LOOPBACK_HOST,
} from '@test/support/constants/request-layer.constants';
import { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import { MissingTestDataError } from '@test/support/errors/missing-test-data.error';
import { TestRollbackError } from '@test/support/errors/test-rollback.error';
import { uniqueEmail, userCtx } from '@test/support/fixtures/identity.fixture';
import { createIntegrationConfig } from '@test/support/fixtures/integration-env.fixture';
import { newRun, newRunStep } from '@test/support/fixtures/runs.fixture';
import { createWorkspaceInput } from '@test/support/fixtures/workspace.fixture';
import { ensureRunParents } from '@test/support/helpers/parent-rows.helpers';
import { createApi, websocketUrl } from '@test/support/helpers/request-layer.helpers';
import type {
  LiveSubscription,
  SeededSimulationRun,
  SimulatorIds,
  SubscriptionsApi,
  TestMember,
} from '@test/support/typedefs/graphql-subscriptions.typedefs';

export const startSubscriptionsApi = async (): Promise<SubscriptionsApi> => {
  const config = createIntegrationConfig(API_ROLE_SELECTION, TestRedisPrefix.GraphqlSubscriptions);
  const app = await createApi(APP_MODULES, config);
  await app.init();
  await app.listen(EPHEMERAL_PORT, LOOPBACK_HOST);
  const redis = createRedisConnection(config.redis.queueUrl, RedisConnectionName.Queue);
  return { app, config, redis };
};

export const stopSubscriptionsApi = async (api: SubscriptionsApi): Promise<void> => {
  await closeRedisConnection(api.redis);
  await api.app.close();
};

const seedUser = async (api: SubscriptionsApi): Promise<string> => {
  const userId = api.app.get(IdService).generate();
  await api.app.get(UsersRepository).upsertUnconfirmed({
    id: userId,
    email: uniqueEmail(),
    name: TEST_MEMBER_NAME,
    passwordHash: TEST_MEMBER_PASSWORD_HASH,
    locale: Locale.En,
  });
  return userId;
};

const accessTokenFor = async (api: SubscriptionsApi, userId: string): Promise<string> => {
  const sessionId = api.app.get(IdService).generate();
  return (await api.app.get(AccessTokenService).issue({ userId, sessionId })).token;
};

export const seedOwner = async (api: SubscriptionsApi): Promise<TestMember> => {
  const userId = await seedUser(api);
  const created = await api.app
    .get(CreateWorkspaceUseCase)
    .execute(userCtx(userId), createWorkspaceInput());
  const publicWorkspaceId = created.workspace.id;
  return {
    workspaceId: api.app.get(IdService).fromPublic(IdPrefix.Workspace, publicWorkspaceId),
    publicWorkspaceId,
    accessToken: await accessTokenFor(api, userId),
  };
};

export const seedMember = async (
  api: SubscriptionsApi,
  owner: TestMember,
  role: WorkspaceRole,
): Promise<TestMember> => {
  const userId = await seedUser(api);
  const { workspaceId } = owner;
  await api.app.get(TenantTransactionService).run(workspaceId, async () => {
    await api.app.get(MembershipsRepository).insertIfAbsent({
      id: api.app.get(IdService).generate(),
      workspaceId,
      userId,
      roleId: await api.app.get(WorkspaceRolesService).systemRoleId(workspaceId, role),
    });
  });
  return { ...owner, accessToken: await accessTokenFor(api, userId) };
};

export const seedRun = async (
  api: SubscriptionsApi,
  workspaceId: string,
  mode: ConversationMode = ConversationMode.Simulation,
): Promise<string> => {
  const run = { ...newRun({ ids: api.app.get(IdService) }, workspaceId), mode };
  await ensureRunParents(api.app, run);
  await api.app
    .get(TenantTransactionService)
    .run(workspaceId, () => api.app.get(RunsRepository).insert(run));
  return run.id;
};

export const seedSimulationRuns = async (
  api: SubscriptionsApi,
  owner: TestMember,
  simulation: SimulatorIds,
  stepCounts: readonly number[],
): Promise<SeededSimulationRun[]> => {
  const ids = api.app.get(IdService);
  const { workspaceId } = owner;
  const agentId = ids.fromPublic(IdPrefix.Agent, simulation.agentId);
  const conversationId = ids.fromPublic(IdPrefix.Conversation, simulation.conversationId);
  return api.app.get(TenantTransactionService).run(workspaceId, async () => {
    const draft = await api.app.get(AgentVersionsRepository).findDraft(workspaceId, agentId);
    if (draft === null) {
      throw new MissingTestDataError(agentId);
    }
    const seeded: SeededSimulationRun[] = [];
    for (const stepCount of stepCounts) {
      const run = {
        ...newRun({ ids }, workspaceId),
        mode: ConversationMode.Simulation,
        conversationId,
        agentId,
        versionId: draft.id,
      };
      await ensureRunParents(api.app, run);
      await api.app.get(RunsRepository).insert(run);
      for (let index = 0; index < stepCount; index += 1) {
        const step = newRunStep({ ids }, run, { nodeId: `${TEST_STEP_NODE_PREFIX}${index}` });
        await api.app.get(RunStepsRepository).start(step);
      }
      seeded.push({ id: ids.toPublic(IdPrefix.Run, run.id), stepCount });
    }
    return seeded;
  });
};

export const replaceDraftFlow = async (
  api: SubscriptionsApi,
  member: TestMember,
  agentId: string,
  flow: FlowDocument,
): Promise<void> => {
  const { workspaceId } = member;
  const ids = api.app.get(IdService);
  const internalId = ids.fromPublic(IdPrefix.Agent, agentId);
  const versions = api.app.get(AgentVersionsRepository);
  await api.app.get(TenantTransactionService).run(workspaceId, async () => {
    const draft = await versions.findDraft(workspaceId, internalId);
    if (draft === null) {
      throw new MissingTestDataError(internalId);
    }
    const changes = { flow, note: null, authorId: TEST_EDITOR_ID };
    await versions.updateDraft(workspaceId, draft.id, draft.revision, changes);
  });
};

export const publicRunId = (api: SubscriptionsApi, runId: string): string =>
  api.app.get(IdService).toPublic(IdPrefix.Run, runId);

export const publicStepId = (api: SubscriptionsApi, stepId: string): string =>
  api.app.get(IdService).toPublic(IdPrefix.RunStep, stepId);

export const subscribeToRunSteps = (
  api: SubscriptionsApi,
  member: TestMember,
  runId: string,
): LiveSubscription => {
  const client = createClient({
    url: websocketUrl(api.app),
    webSocketImpl: WebSocket,
    connectionParams: {
      [ConnectionParam.Authorization]: `Bearer ${member.accessToken}`,
      [ConnectionParam.WorkspaceId]: member.publicWorkspaceId,
    },
    retryAttempts: 0,
  });
  const results = client.iterate({ query: RUN_STEPS_SUBSCRIPTION, variables: { runId } });
  return { next: () => results.next(), close: async () => client.dispose() };
};

export const waitForListener = (api: SubscriptionsApi, runId: string): Promise<void> =>
  vi.waitFor(async () => {
    const channel = withRedisKeyPrefix(
      api.config.redis.keyPrefix,
      channelFor(runStepsChannel, runId).key,
    );
    const reply = await api.redis.pubsub('NUMSUB', channel);
    expect(Number(reply[SUBSCRIBERS_REPLY_COUNT_INDEX])).toBeGreaterThan(0);
  });

export const publishStep = async (
  api: SubscriptionsApi,
  workspaceId: string,
  runId: string,
  commit: boolean,
): Promise<string> => {
  const stepId = api.app.get(IdService).generate();
  const work = api.app.get(TenantTransactionService).run(workspaceId, async () => {
    await api.app.get(LiveUpdatesService).publish(channelFor(runStepsChannel, runId), {
      runId,
      stepId,
      status: RunStepStatus.Running,
      nodeId: ROOT_BRANCH_KEY,
      branchKey: ROOT_BRANCH_KEY,
      port: null,
    });
    if (!commit) {
      throw new TestRollbackError();
    }
  });
  if (commit) {
    await work;
  } else {
    await expect(work).rejects.toBeInstanceOf(TestRollbackError);
  }
  return stepId;
};
