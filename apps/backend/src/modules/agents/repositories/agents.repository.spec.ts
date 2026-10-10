import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PauseMode } from '@/modules/agents/constants/agent.constants';
import { AgentsRepository } from '@/modules/agents/repositories/agents.repository';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import {
  AGENTS_TEST_LATER,
  AGENTS_TEST_START,
  TEST_AGENT_NEW_NAME,
  TEST_AGENT_PAGE_LIMIT,
  TEST_AWAY_MESSAGE,
} from '@test/support/constants/agents-testing.constants';
import { newAgent } from '@test/support/fixtures/agents.fixture';
import { createAgentsTestingModule } from '@test/support/helpers/agents-testing.helpers';

const ROW_LEVEL_SECURITY_VIOLATION = { cause: { code: '42501' } };

describe('AgentsRepository', () => {
  let testingModule: TestingModule;
  let repository: AgentsRepository;
  let tenants: TenantTransactionService;
  let ids: IdService;

  beforeAll(async () => {
    testingModule = await createAgentsTestingModule();
    repository = testingModule.get(AgentsRepository);
    tenants = testingModule.get(TenantTransactionService);
    ids = testingModule.get(IdService);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  const insertAgent = async (workspaceId: string): Promise<string> => {
    const agentId = ids.generate();
    await tenants.run(workspaceId, () => repository.insert(newAgent(agentId, workspaceId)));
    return agentId;
  };

  it('stores an agent with no versions and no pause', async () => {
    const workspaceId = ids.generate();
    const agentId = await insertAgent(workspaceId);

    const found = await tenants.run(workspaceId, () => repository.findById(workspaceId, agentId));

    expect(found).toMatchObject({
      id: agentId,
      workspaceId,
      liveVersionId: null,
      draftVersionId: null,
      pausedAt: null,
      pauseMode: null,
      awayMessage: null,
    });
  });

  it('renames an agent and stamps the given time', async () => {
    const workspaceId = ids.generate();
    const agentId = await insertAgent(workspaceId);

    const renamed = await tenants.run(workspaceId, () =>
      repository.rename(workspaceId, agentId, TEST_AGENT_NEW_NAME, AGENTS_TEST_LATER),
    );
    const found = await tenants.run(workspaceId, () => repository.findById(workspaceId, agentId));

    expect(renamed).toBe(true);
    expect(found).toMatchObject({ name: TEST_AGENT_NEW_NAME, updatedAt: AGENTS_TEST_LATER });
    expect(found?.createdAt).toEqual(AGENTS_TEST_START);
  });

  it('points an agent at its draft and live versions', async () => {
    const workspaceId = ids.generate();
    const agentId = await insertAgent(workspaceId);
    const draftId = ids.generate();
    const liveId = ids.generate();

    await tenants.run(workspaceId, async () => {
      await repository.setDraftVersion(workspaceId, agentId, draftId, AGENTS_TEST_LATER);
      await repository.setLiveVersion(workspaceId, agentId, liveId, AGENTS_TEST_LATER);
    });
    const found = await tenants.run(workspaceId, () => repository.findById(workspaceId, agentId));

    expect(found).toMatchObject({ draftVersionId: draftId, liveVersionId: liveId });
  });

  it('sets and clears the pause settings', async () => {
    const workspaceId = ids.generate();
    const agentId = await insertAgent(workspaceId);

    await tenants.run(workspaceId, () =>
      repository.setPause(
        workspaceId,
        agentId,
        {
          mode: PauseMode.AwayMessage,
          awayMessage: TEST_AWAY_MESSAGE,
          pausedAt: AGENTS_TEST_LATER,
        },
        AGENTS_TEST_LATER,
      ),
    );
    const paused = await tenants.run(workspaceId, () => repository.findById(workspaceId, agentId));
    await tenants.run(workspaceId, () =>
      repository.setPause(workspaceId, agentId, null, AGENTS_TEST_LATER),
    );
    const resumed = await tenants.run(workspaceId, () => repository.findById(workspaceId, agentId));

    expect(paused).toMatchObject({
      pauseMode: PauseMode.AwayMessage,
      awayMessage: TEST_AWAY_MESSAGE,
      pausedAt: AGENTS_TEST_LATER,
    });
    expect(resumed).toMatchObject({ pauseMode: null, awayMessage: null, pausedAt: null });
  });

  it('lists agents in id order, a page at a time', async () => {
    const workspaceId = ids.generate();
    const created = [
      await insertAgent(workspaceId),
      await insertAgent(workspaceId),
      await insertAgent(workspaceId),
    ];

    const first = await tenants.run(workspaceId, () =>
      repository.listPage(workspaceId, null, TEST_AGENT_PAGE_LIMIT),
    );
    const second = await tenants.run(workspaceId, () =>
      repository.listPage(workspaceId, created[1] ?? null, TEST_AGENT_PAGE_LIMIT),
    );

    expect(first.map((agent) => agent.id)).toEqual(created.slice(0, TEST_AGENT_PAGE_LIMIT));
    expect(second.map((agent) => agent.id)).toEqual(created.slice(TEST_AGENT_PAGE_LIMIT));
  });

  it('deletes an agent', async () => {
    const workspaceId = ids.generate();
    const agentId = await insertAgent(workspaceId);

    const deleted = await tenants.run(workspaceId, () => repository.delete(workspaceId, agentId));
    const deletedAgain = await tenants.run(workspaceId, () =>
      repository.delete(workspaceId, agentId),
    );
    const found = await tenants.run(workspaceId, () => repository.findById(workspaceId, agentId));

    expect({ deleted, deletedAgain, found }).toEqual({
      deleted: true,
      deletedAgain: false,
      found: null,
    });
  });

  describe('across tenants', () => {
    it('never shows, changes or deletes the agent of another workspace', async () => {
      const workspaceA = ids.generate();
      const workspaceB = ids.generate();
      const agentId = await insertAgent(workspaceA);

      const fromB = await tenants.run(workspaceB, async () => ({
        found: await repository.findById(workspaceA, agentId),
        page: await repository.listPage(workspaceA, null, TEST_AGENT_PAGE_LIMIT),
        renamed: await repository.rename(
          workspaceA,
          agentId,
          TEST_AGENT_NEW_NAME,
          AGENTS_TEST_LATER,
        ),
        deleted: await repository.delete(workspaceA, agentId),
      }));
      const ownFromA = await tenants.run(workspaceA, () =>
        repository.findById(workspaceA, agentId),
      );

      expect(fromB).toEqual({ found: null, page: [], renamed: false, deleted: false });
      expect(ownFromA?.name).not.toBe(TEST_AGENT_NEW_NAME);
    });

    it('shows nothing without a tenant', async () => {
      const workspaceId = ids.generate();
      const agentId = await insertAgent(workspaceId);

      expect(await repository.findById(workspaceId, agentId)).toBeNull();
    });

    it('refuses to write an agent into another workspace', async () => {
      const workspaceA = ids.generate();
      const workspaceB = ids.generate();

      const write = tenants.run(workspaceB, () =>
        repository.insert(newAgent(ids.generate(), workspaceA)),
      );

      await expect(write).rejects.toMatchObject(ROW_LEVEL_SECURITY_VIOLATION);
    });
  });
});
