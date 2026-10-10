import { ErrorReason } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RunStatus } from '@/modules/runs/constants/run.constants';
import { RunLifecycleService } from '@/modules/runs/services/run-lifecycle.service';
import { TEST_NODE_ID } from '@test/support/constants/agents-testing.constants';
import {
  AgentChange,
  FIRST_STEP_ID,
  FIRST_STEP_KEY,
  SECOND_STEP_ID,
  SECOND_STEP_KEY,
} from '@test/support/constants/runs-testing.constants';
import { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import { triggerFlow } from '@test/support/fixtures/agents.fixture';
import { agentNode, flowEdge, stepFlow } from '@test/support/fixtures/runs.fixture';
import {
  changeAgent,
  createRunLifecycleTestbed,
  readLifecycle,
  receiveMessage,
  republish,
  seedLiveConversation,
} from '@test/support/helpers/runs-testing.helpers';
import type { RunLifecycleTestbed } from '@test/support/typedefs/runs-testing.typedefs';

const oneStep = (id: string, key: string) =>
  stepFlow([agentNode(id, key)], [flowEdge(TEST_NODE_ID, id)]);

describe('ExecuteRunUseCase', () => {
  let testbed: RunLifecycleTestbed;

  beforeAll(async () => {
    testbed = await createRunLifecycleTestbed(TestRedisPrefix.RunEnd);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('runs three quick messages as one run, then one run for the two that came during it', async () => {
    const seeded = await seedLiveConversation(testbed, triggerFlow());
    const first = await receiveMessage(testbed, seeded);
    const second = await receiveMessage(testbed, seeded);
    const third = await receiveMessage(testbed, seeded);

    const followUp = await testbed.executeRun.execute(seeded.ctx, { runId: String(first.run?.id) });
    const during = await readLifecycle(testbed, seeded);
    const last = await testbed.executeRun.execute(seeded.ctx, { runId: String(followUp?.id) });

    const after = await readLifecycle(testbed, seeded);
    expect([second.run, third.run, last]).toEqual([null, null, null]);
    expect(followUp).toMatchObject({
      versionId: seeded.versionId,
      lastCoveredMessageId: third.message.id,
    });
    expect(during.conversation?.activeRunId).toBe(followUp?.id);
    expect(after.conversation?.activeRunId).toBeNull();
    expect(after.latest).toMatchObject({ id: followUp?.id, status: RunStatus.Succeeded });
  });

  it('fails the run and releases the conversation when the run cannot load', async () => {
    const seeded = await seedLiveConversation(testbed, triggerFlow());
    const { run } = await receiveMessage(testbed, seeded, { versionId: testbed.ids.generate() });

    const execution = testbed.executeRun.execute(seeded.ctx, { runId: String(run?.id) });

    await expect(execution).rejects.toMatchObject({ reason: ErrorReason.AgentVersionNotFound });
    const after = await readLifecycle(testbed, seeded);
    expect(after.latest?.status).toBe(RunStatus.Failed);
    expect(after.latest?.error?.reason).toBe(ErrorReason.AgentVersionNotFound);
    expect(after.conversation?.activeRunId).toBeNull();
  });

  it('keeps the pinned version when the agent is published mid-run', async () => {
    const seeded = await seedLiveConversation(testbed, oneStep(FIRST_STEP_ID, FIRST_STEP_KEY));
    const { run } = await receiveMessage(testbed, seeded);
    const published = await republish(testbed, seeded, oneStep(SECOND_STEP_ID, SECOND_STEP_KEY));
    await receiveMessage(testbed, seeded);

    const followUp = await testbed.executeRun.execute(seeded.ctx, { runId: String(run?.id) });

    const runId = String(run?.id);
    expect(testbed.executor.callsFor(runId, FIRST_STEP_ID)).toBe(1);
    expect(testbed.executor.callsFor(runId, SECOND_STEP_ID)).toBe(0);
    expect(followUp?.versionId).toBe(published);
  });

  it.each(Object.values(AgentChange))(
    'ends the run without a follow-up after the agent changes mid-run: %s',
    async (change) => {
      const seeded = await seedLiveConversation(testbed, triggerFlow());
      const { workspaceId } = seeded.conversation;
      const runId = String((await receiveMessage(testbed, seeded)).run?.id);
      await receiveMessage(testbed, seeded);
      await testbed.execution.execute(seeded.ctx, workspaceId, runId);
      await changeAgent(testbed, seeded, change);

      const followUp = await testbed.tenants.run(workspaceId, () =>
        testbed.module.get(RunLifecycleService).endRun(seeded.ctx, workspaceId, runId),
      );

      const after = await readLifecycle(testbed, seeded);
      expect(followUp).toBeNull();
      expect(after.conversation?.activeRunId).toBeNull();
    },
  );
});
