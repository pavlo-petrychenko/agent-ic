import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  AgentVersionKind,
  DRAFT_INITIAL_REVISION,
} from '@/modules/agents/constants/agent.constants';
import { AgentVersionsRepository } from '@/modules/agents/repositories/agent-versions.repository';
import { AgentsRepository } from '@/modules/agents/repositories/agents.repository';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import {
  AGENTS_TEST_LATER,
  TEST_VERSION_NOTE,
} from '@test/support/constants/agents-testing.constants';
import {
  CHECK_VIOLATION,
  ROW_LEVEL_SECURITY_VIOLATION,
  UNIQUE_VIOLATION,
} from '@test/support/constants/postgres-errors.constants';
import {
  emptyFlow,
  newAgent,
  newVersion,
  triggerFlow,
} from '@test/support/fixtures/agents.fixture';
import { createAgentsTestingModule } from '@test/support/helpers/agents-testing.helpers';

const FIRST_NUMBER = 1;
const SECOND_NUMBER = 2;

describe('AgentVersionsRepository', () => {
  let testingModule: TestingModule;
  let agents: AgentsRepository;
  let repository: AgentVersionsRepository;
  let tenants: TenantTransactionService;
  let ids: IdService;

  beforeAll(async () => {
    testingModule = await createAgentsTestingModule();
    agents = testingModule.get(AgentsRepository);
    repository = testingModule.get(AgentVersionsRepository);
    tenants = testingModule.get(TenantTransactionService);
    ids = testingModule.get(IdService);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  const insertAgent = async (workspaceId: string): Promise<string> => {
    const agentId = ids.generate();
    await tenants.run(workspaceId, () => agents.insert(newAgent(agentId, workspaceId)));
    return agentId;
  };

  const insertVersion = async (
    workspaceId: string,
    agentId: string,
    kind: AgentVersionKind,
    number: number | null = null,
  ): Promise<string> => {
    const versionId = ids.generate();
    await tenants.run(workspaceId, () =>
      repository.insert(newVersion(versionId, workspaceId, agentId, { kind, number })),
    );
    return versionId;
  };

  it('stores a draft and finds it by id and as the agent draft', async () => {
    const workspaceId = ids.generate();
    const agentId = await insertAgent(workspaceId);
    const draftId = await insertVersion(workspaceId, agentId, AgentVersionKind.Draft);

    const byId = await tenants.run(workspaceId, () => repository.findById(workspaceId, draftId));
    const draft = await tenants.run(workspaceId, () => repository.findDraft(workspaceId, agentId));

    expect(byId).toMatchObject({
      id: draftId,
      agentId,
      kind: AgentVersionKind.Draft,
      number: null,
      flow: emptyFlow(),
      note: null,
      authorId: null,
      publishedAt: null,
    });
    expect(draft?.id).toBe(draftId);
  });

  it('changes the draft and nothing else', async () => {
    const workspaceId = ids.generate();
    const agentId = await insertAgent(workspaceId);
    const draftId = await insertVersion(workspaceId, agentId, AgentVersionKind.Draft);
    const publishedId = await insertVersion(
      workspaceId,
      agentId,
      AgentVersionKind.Published,
      FIRST_NUMBER,
    );
    const snapshotId = await insertVersion(workspaceId, agentId, AgentVersionKind.Snapshot);
    const changes = { flow: triggerFlow(), note: TEST_VERSION_NOTE, authorId: ids.generate() };
    const update = (versionId: string): Promise<number | null> =>
      repository.updateDraft(
        workspaceId,
        versionId,
        DRAFT_INITIAL_REVISION,
        changes,
        AGENTS_TEST_LATER,
      );

    const results = await tenants.run(workspaceId, async () => ({
      draft: await update(draftId),
      published: await update(publishedId),
      snapshot: await update(snapshotId),
    }));
    const draft = await tenants.run(workspaceId, () => repository.findById(workspaceId, draftId));
    const published = await tenants.run(workspaceId, () =>
      repository.findById(workspaceId, publishedId),
    );
    const snapshot = await tenants.run(workspaceId, () =>
      repository.findById(workspaceId, snapshotId),
    );

    expect(results).toEqual({ draft: DRAFT_INITIAL_REVISION + 1, published: null, snapshot: null });
    expect(draft).toMatchObject({
      ...changes,
      revision: DRAFT_INITIAL_REVISION + 1,
      updatedAt: AGENTS_TEST_LATER,
    });
    expect(published?.flow).toEqual(emptyFlow());
    expect(snapshot?.flow).toEqual(emptyFlow());
  });

  it('changes nothing when the draft is at another revision', async () => {
    const workspaceId = ids.generate();
    const agentId = await insertAgent(workspaceId);
    const draftId = await insertVersion(workspaceId, agentId, AgentVersionKind.Draft);
    const changes = { flow: triggerFlow(), note: TEST_VERSION_NOTE, authorId: ids.generate() };

    const updated = await tenants.run(workspaceId, () =>
      repository.updateDraft(
        workspaceId,
        draftId,
        DRAFT_INITIAL_REVISION + 1,
        changes,
        AGENTS_TEST_LATER,
      ),
    );
    const draft = await tenants.run(workspaceId, () => repository.findById(workspaceId, draftId));

    expect(updated).toBeNull();
    expect(draft).toMatchObject({ flow: emptyFlow(), revision: DRAFT_INITIAL_REVISION });
  });

  it('lists the versions of one agent, newest first', async () => {
    const workspaceId = ids.generate();
    const agentId = await insertAgent(workspaceId);
    const otherAgentId = await insertAgent(workspaceId);
    const draftId = await insertVersion(workspaceId, agentId, AgentVersionKind.Draft);
    const publishedId = await insertVersion(
      workspaceId,
      agentId,
      AgentVersionKind.Published,
      FIRST_NUMBER,
    );
    await insertVersion(workspaceId, otherAgentId, AgentVersionKind.Draft);

    const versions = await tenants.run(workspaceId, () =>
      repository.listByAgent(workspaceId, agentId),
    );

    expect(versions.map((version) => version.id)).toEqual([publishedId, draftId]);
  });

  it('reports the last published number, zero before the first', async () => {
    const workspaceId = ids.generate();
    const agentId = await insertAgent(workspaceId);
    await insertVersion(workspaceId, agentId, AgentVersionKind.Draft);
    const beforeFirst = await tenants.run(workspaceId, () =>
      repository.lastPublishedNumber(workspaceId, agentId),
    );
    await insertVersion(workspaceId, agentId, AgentVersionKind.Published, FIRST_NUMBER);
    await insertVersion(workspaceId, agentId, AgentVersionKind.Published, SECOND_NUMBER);

    const afterTwo = await tenants.run(workspaceId, () =>
      repository.lastPublishedNumber(workspaceId, agentId),
    );

    expect({ beforeFirst, afterTwo }).toEqual({ beforeFirst: 0, afterTwo: SECOND_NUMBER });
  });

  it('removes the versions with their agent', async () => {
    const workspaceId = ids.generate();
    const agentId = await insertAgent(workspaceId);
    const draftId = await insertVersion(workspaceId, agentId, AgentVersionKind.Draft);

    await tenants.run(workspaceId, () => agents.delete(workspaceId, agentId));
    const found = await tenants.run(workspaceId, () => repository.findById(workspaceId, draftId));

    expect(found).toBeNull();
  });

  describe('constraints', () => {
    it('allows one draft per agent', async () => {
      const workspaceId = ids.generate();
      const agentId = await insertAgent(workspaceId);
      await insertVersion(workspaceId, agentId, AgentVersionKind.Draft);

      const second = insertVersion(workspaceId, agentId, AgentVersionKind.Draft);

      await expect(second).rejects.toMatchObject(UNIQUE_VIOLATION);
    });

    it('allows a published number once per agent', async () => {
      const workspaceId = ids.generate();
      const agentId = await insertAgent(workspaceId);
      await insertVersion(workspaceId, agentId, AgentVersionKind.Published, FIRST_NUMBER);

      const again = insertVersion(workspaceId, agentId, AgentVersionKind.Published, FIRST_NUMBER);

      await expect(again).rejects.toMatchObject(UNIQUE_VIOLATION);
    });

    it('numbers published versions only', async () => {
      const workspaceId = ids.generate();
      const agentId = await insertAgent(workspaceId);

      const numberedDraft = insertVersion(
        workspaceId,
        agentId,
        AgentVersionKind.Draft,
        FIRST_NUMBER,
      );
      const unnumberedPublished = insertVersion(workspaceId, agentId, AgentVersionKind.Published);

      await expect(numberedDraft).rejects.toMatchObject(CHECK_VIOLATION);
      await expect(unnumberedPublished).rejects.toMatchObject(CHECK_VIOLATION);
    });
  });

  describe('across tenants', () => {
    it('never shows, changes or numbers the versions of another workspace', async () => {
      const workspaceA = ids.generate();
      const workspaceB = ids.generate();
      const agentId = await insertAgent(workspaceA);
      const draftId = await insertVersion(workspaceA, agentId, AgentVersionKind.Draft);
      await insertVersion(workspaceA, agentId, AgentVersionKind.Published, FIRST_NUMBER);

      const fromB = await tenants.run(workspaceB, async () => ({
        byId: await repository.findById(workspaceA, draftId),
        draft: await repository.findDraft(workspaceA, agentId),
        list: await repository.listByAgent(workspaceA, agentId),
        last: await repository.lastPublishedNumber(workspaceA, agentId),
        updated: await repository.updateDraft(
          workspaceA,
          draftId,
          DRAFT_INITIAL_REVISION,
          { flow: triggerFlow(), note: TEST_VERSION_NOTE, authorId: ids.generate() },
          AGENTS_TEST_LATER,
        ),
      }));

      expect(fromB).toEqual({ byId: null, draft: null, list: [], last: 0, updated: null });
    });

    it('shows nothing without a tenant', async () => {
      const workspaceId = ids.generate();
      const agentId = await insertAgent(workspaceId);
      const draftId = await insertVersion(workspaceId, agentId, AgentVersionKind.Draft);

      expect(await repository.findById(workspaceId, draftId)).toBeNull();
    });

    it('refuses to write a version into another workspace', async () => {
      const workspaceA = ids.generate();
      const workspaceB = ids.generate();
      const agentId = await insertAgent(workspaceA);

      const write = tenants.run(workspaceB, () =>
        repository.insert(newVersion(ids.generate(), workspaceA, agentId)),
      );

      await expect(write).rejects.toMatchObject(ROW_LEVEL_SECURITY_VIOLATION);
    });
  });
});
