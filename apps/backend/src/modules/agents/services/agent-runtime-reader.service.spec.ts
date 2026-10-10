import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AgentVersionKind, PauseMode } from '@/modules/agents/constants/agent.constants';
import { AgentNotFoundError } from '@/modules/agents/errors/agent-not-found.error';
import { AgentVersionNotFoundError } from '@/modules/agents/errors/agent-version-not-found.error';
import { AgentVersionsRepository } from '@/modules/agents/repositories/agent-versions.repository';
import { AgentsRepository } from '@/modules/agents/repositories/agents.repository';
import { AgentPublishingService } from '@/modules/agents/services/agent-publishing.service';
import { AgentRuntimeReader } from '@/modules/agents/services/agent-runtime-reader.service';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import {
  AGENTS_TEST_LATER,
  TEST_AWAY_MESSAGE,
  TEST_NODE_NEW_LABEL,
  TEST_VERSION_NOTE,
} from '@test/support/constants/agents-testing.constants';
import { emptyFlow, triggerFlow } from '@test/support/fixtures/agents.fixture';
import {
  createAgentsTestingModule,
  seedAgentWithDraft,
} from '@test/support/helpers/agents-testing.helpers';

describe('AgentRuntimeReader', () => {
  let testingModule: TestingModule;
  let reader: AgentRuntimeReader;
  let publishing: AgentPublishingService;
  let agents: AgentsRepository;
  let versions: AgentVersionsRepository;
  let tenants: TenantTransactionService;
  let ids: IdService;

  beforeAll(async () => {
    testingModule = await createAgentsTestingModule();
    reader = testingModule.get(AgentRuntimeReader);
    publishing = testingModule.get(AgentPublishingService);
    agents = testingModule.get(AgentsRepository);
    versions = testingModule.get(AgentVersionsRepository);
    tenants = testingModule.get(TenantTransactionService);
    ids = testingModule.get(IdService);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  it('has no live version before the first publish', async () => {
    const workspaceId = ids.generate();
    const { agentId } = await seedAgentWithDraft(testingModule, workspaceId);

    const live = await tenants.run(workspaceId, () => reader.getLiveVersion(workspaceId, agentId));

    expect(live).toBeNull();
  });

  it('returns the pinned flow after a newer publish', async () => {
    const workspaceId = ids.generate();
    const { agentId, draftId } = await seedAgentWithDraft(testingModule, workspaceId);
    const first = await tenants.run(workspaceId, () =>
      publishing.publish(workspaceId, agentId, { authorId: ids.generate() }),
    );
    const edited = await tenants.run(workspaceId, () =>
      versions.updateDraft(
        workspaceId,
        draftId,
        { flow: triggerFlow(TEST_NODE_NEW_LABEL), note: TEST_VERSION_NOTE },
        AGENTS_TEST_LATER,
      ),
    );
    const second = await tenants.run(workspaceId, () =>
      publishing.publish(workspaceId, agentId, { authorId: ids.generate() }),
    );

    const pinned = await tenants.run(workspaceId, () => reader.getVersion(workspaceId, first.id));
    const live = await tenants.run(workspaceId, () => reader.getLiveVersion(workspaceId, agentId));

    expect(edited).toBe(true);
    expect(pinned).toEqual(first);
    expect(pinned.flow).toEqual(triggerFlow());
    expect(live).toEqual(second);
    expect(live?.flow).toEqual(triggerFlow(TEST_NODE_NEW_LABEL));
  });

  it('fails for a version that does not exist', async () => {
    const workspaceId = ids.generate();

    const read = tenants.run(workspaceId, () => reader.getVersion(workspaceId, ids.generate()));

    await expect(read).rejects.toBeInstanceOf(AgentVersionNotFoundError);
  });

  it('fails for an agent that does not exist', async () => {
    const workspaceId = ids.generate();

    const read = tenants.run(workspaceId, () =>
      reader.getPauseSettings(workspaceId, ids.generate()),
    );

    await expect(read).rejects.toBeInstanceOf(AgentNotFoundError);
  });

  it('returns the pause settings, or none when the agent runs', async () => {
    const workspaceId = ids.generate();
    const { agentId } = await seedAgentWithDraft(testingModule, workspaceId);
    const running = await tenants.run(workspaceId, () =>
      reader.getPauseSettings(workspaceId, agentId),
    );
    await tenants.run(workspaceId, () =>
      agents.setPause(
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

    const paused = await tenants.run(workspaceId, () =>
      reader.getPauseSettings(workspaceId, agentId),
    );

    expect(running).toBeNull();
    expect(paused).toEqual({
      mode: PauseMode.AwayMessage,
      awayMessage: TEST_AWAY_MESSAGE,
      pausedAt: AGENTS_TEST_LATER,
    });
  });

  describe('snapshotDraft', () => {
    it('freezes the draft into an immutable snapshot', async () => {
      const workspaceId = ids.generate();
      const { agentId, draftId } = await seedAgentWithDraft(testingModule, workspaceId);

      const snapshot = await tenants.run(workspaceId, () =>
        reader.snapshotDraft(workspaceId, agentId),
      );
      await tenants.run(workspaceId, () =>
        versions.updateDraft(
          workspaceId,
          draftId,
          { flow: emptyFlow(), note: TEST_VERSION_NOTE },
          AGENTS_TEST_LATER,
        ),
      );

      const stored = await tenants.run(workspaceId, () =>
        reader.getVersion(workspaceId, snapshot.id),
      );
      const frozen = await tenants.run(workspaceId, () =>
        versions.updateDraft(
          workspaceId,
          snapshot.id,
          { flow: emptyFlow(), note: TEST_VERSION_NOTE },
          AGENTS_TEST_LATER,
        ),
      );
      const agent = await tenants.run(workspaceId, () => agents.findById(workspaceId, agentId));
      expect(snapshot).toMatchObject({
        kind: AgentVersionKind.Snapshot,
        number: null,
        publishedAt: null,
        flow: triggerFlow(),
      });
      expect(stored).toEqual(snapshot);
      expect(frozen).toBe(false);
      expect(agent?.liveVersionId).toBeNull();
    });

    it('fails when the agent has no draft', async () => {
      const workspaceId = ids.generate();

      const snapshot = tenants.run(workspaceId, () =>
        reader.snapshotDraft(workspaceId, ids.generate()),
      );

      await expect(snapshot).rejects.toBeInstanceOf(AgentVersionNotFoundError);
    });
  });
});
