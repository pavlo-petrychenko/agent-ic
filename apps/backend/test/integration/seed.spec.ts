import { WorkspaceRole } from '@agent-ic/contracts';
import { hasBlockingIssues, validateFlow } from '@agent-ic/flow';
import type { INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '@/app/app.module';
import { seedSampleData } from '@/app/helpers/seed.helpers';
import { SAMPLE_AGENT_NAME } from '@/modules/agents/constants/sample-agent.constants';
import { AgentVersionsRepository } from '@/modules/agents/repositories/agent-versions.repository';
import { AgentsRepository } from '@/modules/agents/repositories/agents.repository';
import { SAMPLE_USER_EMAIL } from '@/modules/identity/constants/sample-workspace.constants';
import { MembershipsRepository } from '@/modules/identity/repositories/memberships.repository';
import { UsersRepository } from '@/modules/identity/repositories/users.repository';
import { loadAppConfig } from '@/platform/config/helpers/config.helpers';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { TracingService } from '@/platform/observability/services/tracing.service';
import { TestRedisDatabase } from '@test/support/constants/test-infrastructure.constants';
import { createIntegrationTestEnv } from '@test/support/fixtures/integration-env.fixture';

const FIRST_VERSION_NUMBER = 1;
const AGENT_PAGE_SIZE = 10;

describe('seedSampleData', () => {
  let app: INestApplicationContext;

  beforeAll(async () => {
    const config = loadAppConfig(
      { role: Role.Gateway, queues: [] },
      createIntegrationTestEnv(TestRedisDatabase.Entrypoints),
    );
    app = await NestFactory.createApplicationContext(
      AppModule.forRole(config, new TracingService(config.telemetry)),
      { logger: false },
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates a confirmed owner, a workspace and one live agent with a valid flow', async () => {
    const { userId, workspaceId, agentCreated } = await seedSampleData(app);

    const user = await app.get(UsersRepository).findByEmail(SAMPLE_USER_EMAIL);
    const stored = await app.get(TenantTransactionService).run(workspaceId, async () => {
      const agents = await app.get(AgentsRepository).listPage(workspaceId, null, AGENT_PAGE_SIZE);
      const [agent] = agents;
      const liveVersionId = agent?.liveVersionId ?? null;
      const live =
        liveVersionId === null
          ? null
          : await app.get(AgentVersionsRepository).findById(workspaceId, liveVersionId);
      const role = await app.get(MembershipsRepository).findRole(workspaceId, userId);
      return { agents, live, role };
    });
    expect(agentCreated).toBe(true);
    expect(user?.id).toBe(userId);
    expect(user?.emailConfirmedAt).not.toBeNull();
    expect(stored.role).toBe(WorkspaceRole.Owner);
    expect(stored.agents).toHaveLength(1);
    expect(stored.agents[0]?.name).toBe(SAMPLE_AGENT_NAME);
    expect(stored.live?.number).toBe(FIRST_VERSION_NUMBER);
    expect(hasBlockingIssues(validateFlow(stored.live?.flow))).toBe(false);
  });

  it('changes nothing when it runs again', async () => {
    const first = await seedSampleData(app);

    const second = await seedSampleData(app);

    expect(second).toEqual({ ...first, agentCreated: false });
  });
});
