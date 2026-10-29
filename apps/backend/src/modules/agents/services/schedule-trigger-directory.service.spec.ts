import type { FlowDocument } from '@agent-ic/flow';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PauseMode } from '@/modules/agents/constants/agent.constants';
import { AgentsRepository } from '@/modules/agents/repositories/agents.repository';
import { AgentPublishingService } from '@/modules/agents/services/agent-publishing.service';
import { AgentRuntimeReader } from '@/modules/agents/services/agent-runtime-reader.service';
import { ScheduleTriggerDirectoryService } from '@/modules/agents/services/schedule-trigger-directory.service';
import { ClockService } from '@/platform/clock/services/clock.service';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import {
  TEST_EDITOR_ID,
  TEST_NODE_ID,
  TEST_SCHEDULE_NODE_ID,
} from '@test/support/constants/agents-testing.constants';
import { scheduleFlow, triggerFlow } from '@test/support/fixtures/agents.fixture';
import {
  createAgentsTestingModule,
  seedAgentWithDraft,
} from '@test/support/helpers/agents-testing.helpers';

describe('ScheduleTriggerDirectoryService', () => {
  let testingModule: TestingModule;
  let directory: ScheduleTriggerDirectoryService;
  let reader: AgentRuntimeReader;
  let publishing: AgentPublishingService;
  let agents: AgentsRepository;
  let tenants: TenantTransactionService;
  let ids: IdService;
  let clock: ClockService;

  beforeAll(async () => {
    testingModule = await createAgentsTestingModule();
    directory = testingModule.get(ScheduleTriggerDirectoryService);
    reader = testingModule.get(AgentRuntimeReader);
    publishing = testingModule.get(AgentPublishingService);
    agents = testingModule.get(AgentsRepository);
    tenants = testingModule.get(TenantTransactionService);
    ids = testingModule.get(IdService);
    clock = testingModule.get(ClockService);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  const publishAgent = async (flow: FlowDocument) => {
    const workspaceId = ids.generate();
    const { agentId } = await seedAgentWithDraft(testingModule, workspaceId, flow);
    const version = await tenants.run(workspaceId, () =>
      publishing.publish(workspaceId, agentId, { authorId: TEST_EDITOR_ID }),
    );
    return { workspaceId, agentId, version };
  };

  const listedAgents = async () => (await directory.listLive()).map((live) => live.agentId);

  it('lists the schedule triggers of live versions across workspaces', async () => {
    const first = await publishAgent(scheduleFlow());
    const second = await publishAgent(scheduleFlow());
    const plain = await publishAgent(triggerFlow());

    const live = await directory.listLive();

    expect(live).toContainEqual({
      workspaceId: first.workspaceId,
      agentId: first.agentId,
      versionId: first.version.id,
      publishedAt: first.version.publishedAt,
      node: scheduleFlow().nodes.find((node) => node.id === TEST_SCHEDULE_NODE_ID),
    });
    expect(live.map((trigger) => trigger.agentId)).toContain(second.agentId);
    expect(live.map((trigger) => trigger.agentId)).not.toContain(plain.agentId);
  });

  it('skips paused and deleted agents', async () => {
    const paused = await publishAgent(scheduleFlow());
    const deleted = await publishAgent(scheduleFlow());
    await tenants.run(paused.workspaceId, () =>
      agents.setPause(paused.workspaceId, paused.agentId, {
        mode: PauseMode.Inbox,
        awayMessage: null,
        pausedAt: clock.now(),
      }),
    );
    await tenants.run(deleted.workspaceId, () =>
      agents.delete(deleted.workspaceId, deleted.agentId, clock.now()),
    );

    const listed = await listedAgents();

    expect(listed).not.toContain(paused.agentId);
    expect(listed).not.toContain(deleted.agentId);
  });

  it('finds a live schedule trigger and reports the pause', async () => {
    const { workspaceId, agentId, version } = await publishAgent(scheduleFlow());

    const found = await tenants.run(workspaceId, () =>
      reader.findLiveScheduleTrigger(workspaceId, agentId, TEST_SCHEDULE_NODE_ID),
    );
    await tenants.run(workspaceId, () =>
      agents.setPause(workspaceId, agentId, {
        mode: PauseMode.Inbox,
        awayMessage: null,
        pausedAt: clock.now(),
      }),
    );
    const paused = await tenants.run(workspaceId, () =>
      reader.findLiveScheduleTrigger(workspaceId, agentId, TEST_SCHEDULE_NODE_ID),
    );

    expect(found).toMatchObject({
      trigger: { versionId: version.id, node: { id: TEST_SCHEDULE_NODE_ID } },
      paused: false,
    });
    expect(paused?.paused).toBe(true);
  });

  it('finds nothing for a node that is not a live schedule trigger', async () => {
    const { workspaceId, agentId } = await publishAgent(scheduleFlow());

    const missing = await tenants.run(workspaceId, () =>
      reader.findLiveScheduleTrigger(workspaceId, agentId, TEST_NODE_ID),
    );

    expect(missing).toBeNull();
  });
});
