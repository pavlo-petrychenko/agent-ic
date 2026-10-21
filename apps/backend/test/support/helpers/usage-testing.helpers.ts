import { Locale, WorkspaceRole } from '@agent-ic/contracts';
import { TransactionHost } from '@nestjs-cls/transactional';
import type { TestingModule } from '@nestjs/testing';
import { MembershipsRepository } from '@/modules/identity/repositories/memberships.repository';
import { UsersRepository } from '@/modules/identity/repositories/users.repository';
import { WorkspacesRepository } from '@/modules/identity/repositories/workspaces.repository';
import { WorkspaceRolesService } from '@/modules/identity/services/workspace-roles.service';
import { FakeEmailGateway } from '@/modules/notifications/gateways/email.fake';
import { EmailGateway } from '@/modules/notifications/gateways/email.gateway';
import { UsageJobName } from '@/modules/usage/constants/usage-job.constants';
import type { UsageThreshold } from '@/modules/usage/constants/usage.constants';
import { workspaceLimits } from '@/modules/usage/db/workspace-limits.table';
import { usagePeriodOf } from '@/modules/usage/helpers/usage-period.helpers';
import { UsageCountersRepository } from '@/modules/usage/repositories/usage-counters.repository';
import type {
  UsageCounter,
  WorkspaceLimitOverrides,
} from '@/modules/usage/typedefs/usage.typedefs';
import { UsageModule } from '@/modules/usage/usage.module';
import { ClockService } from '@/platform/clock/services/clock.service';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';
import { DomainEventsModule } from '@/platform/domain-events/domain-events.module';
import { IdService } from '@/platform/ids/services/id.service';
import { LlmModelId } from '@/platform/llm/constants/llm-model.constants';
import { LlmProviderKind } from '@/platform/llm/constants/llm-provider.constants';
import type { LlmUsageReport } from '@/platform/llm/typedefs/llm-usage.typedefs';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { QueueName } from '@/platform/queues/constants/queue.constants';
import { QueuesModule } from '@/platform/queues/queues.module';
import { QueuesService } from '@/platform/queues/services/queues.service';
import { RedisModule } from '@/platform/redis/redis.module';
import { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import {
  TEST_USAGE_OWNER_NAME,
  TEST_USAGE_PASSWORD_HASH,
  TEST_USAGE_TIME_ZONE,
  TEST_USAGE_WORKSPACE_NAME,
  USAGE_TEST_PERIOD,
  USAGE_TEST_START,
} from '@test/support/constants/usage-testing.constants';
import { ManualClock } from '@test/support/fakes/manual-clock.fake';
import { uniqueEmail } from '@test/support/fixtures/identity.fixture';
import { createPlatformTestingModule } from '@test/support/helpers/database-testing.helpers';
import { UsageNeighboursModule } from '@test/support/modules/usage-neighbours.module';
import type {
  UsageTestbed,
  UsageTestOwner,
  UsageTestOwnerInput,
} from '@test/support/typedefs/usage-testing.typedefs';

const ROLE = Role.Api;

export const createUsageTestbed = async (
  redisPrefix: TestRedisPrefix = TestRedisPrefix.Usage,
): Promise<UsageTestbed> => {
  const clock = new ManualClock(USAGE_TEST_START);
  const emails = new FakeEmailGateway();
  const module = await createPlatformTestingModule(
    redisPrefix,
    [
      RedisModule,
      QueuesModule.forRole(ROLE),
      DomainEventsModule.forRole(ROLE),
      UsageNeighboursModule.forRole(ROLE),
      UsageModule.forRole(ROLE),
    ],
    [
      { token: ClockService, value: clock },
      { token: EmailGateway, value: emails },
    ],
  );
  return {
    module,
    clock,
    emails,
    tenants: module.get(TenantTransactionService),
    ids: module.get(IdService),
  };
};

export const meteredReport = (workspaceId: string, credits: number): LlmUsageReport => ({
  workspaceId,
  source: LlmProviderKind.Platform,
  model: LlmModelId.Gpt6Luna,
  inputTokens: 0,
  outputTokens: 0,
  credits,
  metered: true,
});

export const counterOf = (
  testbed: UsageTestbed,
  workspaceId: string,
  period: string = USAGE_TEST_PERIOD,
): Promise<UsageCounter | null> =>
  testbed.tenants.run(workspaceId, () =>
    testbed.module.get(UsageCountersRepository).find(workspaceId, period),
  );

export const conversationsCounted = async (
  module: TestingModule,
  workspaceId: string,
  at: Date,
): Promise<number> => {
  const counter = await module
    .get(TenantTransactionService)
    .run(workspaceId, () =>
      module.get(UsageCountersRepository).find(workspaceId, usagePeriodOf(at).key),
    );
  return counter?.conversations ?? 0;
};

export const setWorkspaceLimits = async (
  testbed: UsageTestbed,
  workspaceId: string,
  overrides: Partial<WorkspaceLimitOverrides>,
): Promise<void> => {
  const txHost: TransactionHost<AppTransactionAdapter> = testbed.module.get(TransactionHost);
  await testbed.tenants.run(workspaceId, async () => {
    await txHost.tx
      .insert(workspaceLimits)
      .values({ workspaceId, ...overrides, updatedAt: testbed.clock.now() })
      .onConflictDoUpdate({ target: workspaceLimits.workspaceId, set: overrides });
  });
};

export const thresholdEmailsQueued = async (
  testbed: UsageTestbed,
  workspaceId: string,
): Promise<UsageThreshold[]> => {
  const jobs = await testbed.module.get(QueuesService).get(QueueName.Notify).getJobs();
  return jobs
    .filter((job) => job.name === UsageJobName.SendThresholdEmail)
    .map((job) => job.data.data)
    .filter((data) => data['workspaceId'] === workspaceId)
    .map((data) => Number(data['threshold']));
};

export const seedOwnedWorkspace = async (
  testbed: UsageTestbed,
  input: UsageTestOwnerInput = { locale: Locale.En },
): Promise<UsageTestOwner> => {
  const userId = testbed.ids.generate();
  const workspaceId = testbed.ids.generate();
  const email = uniqueEmail();
  await testbed.module.get(UsersRepository).upsertUnconfirmed({
    id: userId,
    email,
    name: TEST_USAGE_OWNER_NAME,
    passwordHash: TEST_USAGE_PASSWORD_HASH,
    locale: input.locale,
    createdAt: USAGE_TEST_START,
    updatedAt: USAGE_TEST_START,
  });
  await testbed.tenants.run(workspaceId, async () => {
    await testbed.module.get(WorkspacesRepository).insert({
      id: workspaceId,
      workspaceId,
      name: TEST_USAGE_WORKSPACE_NAME,
      timeZone: TEST_USAGE_TIME_ZONE,
      createdByUserId: userId,
      createdAt: USAGE_TEST_START,
      updatedAt: USAGE_TEST_START,
    });
    const roles = testbed.module.get(WorkspaceRolesService);
    await roles.seedDefaults(workspaceId);
    await testbed.module.get(MembershipsRepository).insertIfAbsent({
      id: testbed.ids.generate(),
      workspaceId,
      userId,
      roleId: await roles.systemRoleId(workspaceId, WorkspaceRole.Owner),
      createdAt: USAGE_TEST_START,
    });
  });
  return { workspaceId, userId, email };
};
