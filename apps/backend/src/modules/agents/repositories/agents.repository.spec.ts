import { TransactionHost } from '@nestjs-cls/transactional';
import type { TestingModule } from '@nestjs/testing';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PauseMode } from '@/modules/agents/constants/agent.constants';
import { agents } from '@/modules/agents/db/agents.table';
import { AgentsRepository } from '@/modules/agents/repositories/agents.repository';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';
import { IdService } from '@/platform/ids/services/id.service';
import {
  AGENTS_TEST_LATER,
  TEST_AGENT_NAME,
  TEST_AGENT_NEW_NAME,
  TEST_AGENT_PAGE_LIMIT,
  TEST_AWAY_MESSAGE,
} from '@test/support/constants/agents-testing.constants';
import { CLOCK_TICK_MS } from '@test/support/constants/manual-clock.constants';
import { ROW_LEVEL_SECURITY_VIOLATION } from '@test/support/constants/postgres-errors.constants';
import type { ManualClock } from '@test/support/fakes/manual-clock.fake';
import { newAgent } from '@test/support/fixtures/agents.fixture';
import {
  createAgentsTestingModule,
  seedAgentVersion,
  seedPublishedVersion,
} from '@test/support/helpers/agents-testing.helpers';
import { manualClockOf } from '@test/support/helpers/manual-clock.helpers';
import { ensureWorkspaceRow } from '@test/support/helpers/parent-rows.helpers';

describe('AgentsRepository', () => {
  let testingModule: TestingModule;
  let repository: AgentsRepository;
  let tenants: TenantTransactionService;
  let ids: IdService;
  let txHost: TransactionHost<AppTransactionAdapter>;
  let clock: ManualClock;

  beforeAll(async () => {
    testingModule = await createAgentsTestingModule();
    repository = testingModule.get(AgentsRepository);
    txHost = testingModule.get<TransactionHost<AppTransactionAdapter>>(TransactionHost);
    tenants = testingModule.get(TenantTransactionService);
    ids = testingModule.get(IdService);
    clock = manualClockOf(testingModule);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  const insertAgent = async (workspaceId: string): Promise<string> => {
    clock.advanceBy(CLOCK_TICK_MS);
    const agentId = ids.generate();
    await ensureWorkspaceRow(testingModule, workspaceId);
    await tenants.run(workspaceId, () => repository.insert(newAgent(agentId, workspaceId)));
    return agentId;
  };

  it('stores an agent with no versions, no pause and both timestamps stamped', async () => {
    const workspaceId = ids.generate();
    const agentId = await insertAgent(workspaceId);
    const createdAt = clock.now();

    const found = await tenants.run(workspaceId, () => repository.findById(workspaceId, agentId));

    expect(found).toMatchObject({
      id: agentId,
      workspaceId,
      liveVersionId: null,
      draftVersionId: null,
      pausedAt: null,
      pauseMode: null,
      awayMessage: null,
      createdAt,
      updatedAt: createdAt,
    });
  });

  it('returns the stored agent from an insert', async () => {
    const workspaceId = ids.generate();
    const agentId = ids.generate();
    await ensureWorkspaceRow(testingModule, workspaceId);

    const stored = await tenants.run(workspaceId, () =>
      repository.insert(newAgent(agentId, workspaceId)),
    );

    expect(stored).toMatchObject({
      id: agentId,
      workspaceId,
      name: TEST_AGENT_NAME,
      createdAt: clock.now(),
      updatedAt: clock.now(),
    });
  });

  it('renames an agent and stamps updatedAt', async () => {
    const workspaceId = ids.generate();
    const agentId = await insertAgent(workspaceId);
    const createdAt = clock.now();
    clock.advanceBy(CLOCK_TICK_MS);

    const renamed = await tenants.run(workspaceId, () =>
      repository.rename(workspaceId, agentId, TEST_AGENT_NEW_NAME),
    );
    const found = await tenants.run(workspaceId, () => repository.findById(workspaceId, agentId));

    expect(renamed).toMatchObject({ name: TEST_AGENT_NEW_NAME, updatedAt: clock.now() });
    expect(found).toMatchObject({ name: TEST_AGENT_NEW_NAME, createdAt, updatedAt: clock.now() });
  });

  it('points an agent at its draft and live versions', async () => {
    const workspaceId = ids.generate();
    const agentId = await insertAgent(workspaceId);
    const draftId = await seedAgentVersion(testingModule, workspaceId, agentId);
    const liveId = await seedPublishedVersion(testingModule, workspaceId, agentId);

    await tenants.run(workspaceId, async () => {
      await repository.setDraftVersion(workspaceId, agentId, draftId);
      await repository.setLiveVersion(workspaceId, agentId, liveId);
    });
    const found = await tenants.run(workspaceId, () => repository.findById(workspaceId, agentId));

    expect(found).toMatchObject({ draftVersionId: draftId, liveVersionId: liveId });
  });

  it('sets and clears the pause settings', async () => {
    const workspaceId = ids.generate();
    const agentId = await insertAgent(workspaceId);

    await tenants.run(workspaceId, () =>
      repository.setPause(workspaceId, agentId, {
        mode: PauseMode.AwayMessage,
        awayMessage: TEST_AWAY_MESSAGE,
        pausedAt: AGENTS_TEST_LATER,
      }),
    );
    const paused = await tenants.run(workspaceId, () => repository.findById(workspaceId, agentId));
    await tenants.run(workspaceId, () => repository.setPause(workspaceId, agentId, null));
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

  it('deletes an agent once, stamping the time, and then neither finds nor changes it', async () => {
    const workspaceId = ids.generate();
    const agentId = await insertAgent(workspaceId);
    clock.advanceBy(CLOCK_TICK_MS);
    const deletedOn = clock.now();

    const deleted = await tenants.run(workspaceId, () =>
      repository.delete(workspaceId, agentId, AGENTS_TEST_LATER),
    );
    clock.advanceBy(CLOCK_TICK_MS);
    const after = await tenants.run(workspaceId, async () => ({
      deletedAgain: await repository.delete(workspaceId, agentId, AGENTS_TEST_LATER),
      renamed: await repository.rename(workspaceId, agentId, TEST_AGENT_NEW_NAME),
      found: await repository.findById(workspaceId, agentId),
      locked: await repository.findByIdForUpdate(workspaceId, agentId),
      stored: await txHost.tx
        .select({ deletedAt: agents.deletedAt, updatedAt: agents.updatedAt })
        .from(agents)
        .where(eq(agents.id, agentId)),
    }));

    expect({ deleted, ...after }).toEqual({
      deleted: true,
      deletedAgain: false,
      renamed: null,
      found: null,
      locked: null,
      stored: [{ deletedAt: AGENTS_TEST_LATER, updatedAt: deletedOn }],
    });
  });

  it('leaves a deleted agent out of lists and counts', async () => {
    const workspaceId = ids.generate();
    const kept = await insertAgent(workspaceId);
    const deleted = await insertAgent(workspaceId);
    await tenants.run(workspaceId, () =>
      repository.delete(workspaceId, deleted, AGENTS_TEST_LATER),
    );

    const read = await tenants.run(workspaceId, async () => ({
      page: await repository.listPage(workspaceId, null, TEST_AGENT_PAGE_LIMIT),
      byIds: await repository.listByIds(workspaceId, [kept, deleted]),
      total: await repository.countByWorkspace(workspaceId),
    }));

    expect({
      page: read.page.map((agent) => agent.id),
      byIds: read.byIds.map((agent) => agent.id),
      total: read.total,
    }).toEqual({ page: [kept], byIds: [kept], total: 1 });
  });

  it('frees the name of a deleted agent', async () => {
    const workspaceId = ids.generate();
    const agentId = await insertAgent(workspaceId);
    const before = await tenants.run(workspaceId, () =>
      repository.findNamesStartingWith(workspaceId, TEST_AGENT_NAME),
    );
    await tenants.run(workspaceId, () =>
      repository.delete(workspaceId, agentId, AGENTS_TEST_LATER),
    );

    const after = await tenants.run(workspaceId, () =>
      repository.findNamesStartingWith(workspaceId, TEST_AGENT_NAME),
    );

    expect({ before, after }).toEqual({ before: [TEST_AGENT_NAME], after: [] });
  });

  describe('across tenants', () => {
    it('never shows, changes or deletes the agent of another workspace', async () => {
      const workspaceA = ids.generate();
      const workspaceB = ids.generate();
      const agentId = await insertAgent(workspaceA);

      const fromB = await tenants.run(workspaceB, async () => ({
        found: await repository.findById(workspaceA, agentId),
        page: await repository.listPage(workspaceA, null, TEST_AGENT_PAGE_LIMIT),
        renamed: await repository.rename(workspaceA, agentId, TEST_AGENT_NEW_NAME),
        deleted: await repository.delete(workspaceA, agentId, AGENTS_TEST_LATER),
      }));
      const ownFromA = await tenants.run(workspaceA, () =>
        repository.findById(workspaceA, agentId),
      );

      expect(fromB).toEqual({ found: null, page: [], renamed: null, deleted: false });
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
