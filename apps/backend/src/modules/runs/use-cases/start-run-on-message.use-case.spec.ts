import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RunStatus } from '@/modules/runs/constants/run.constants';
import { executeRunJob } from '@/modules/runs/jobs/execute-run.job';
import { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import { triggerFlow } from '@test/support/fixtures/agents.fixture';
import {
  createRunLifecycleTestbed,
  readLifecycle,
  receiveMessage,
  republish,
  seedLiveConversation,
} from '@test/support/helpers/runs-testing.helpers';
import type { RunLifecycleTestbed } from '@test/support/typedefs/runs-testing.typedefs';

describe('StartRunOnMessageUseCase', () => {
  let testbed: RunLifecycleTestbed;

  beforeAll(async () => {
    testbed = await createRunLifecycleTestbed(TestRedisPrefix.RunStart);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('claims the conversation, pins the live version and enqueues the run by its id', async () => {
    const seeded = await seedLiveConversation(testbed, triggerFlow());

    const { message, run } = await receiveMessage(testbed, seeded);

    const { conversation, latest } = await readLifecycle(testbed, seeded);
    const job = await testbed.queues.get(executeRunJob.queue).getJob(String(latest?.id));
    expect(latest).toMatchObject({
      versionId: seeded.versionId,
      status: RunStatus.Queued,
      lastCoveredMessageId: message.id,
    });
    expect(run?.id).toBe(latest?.id);
    expect(conversation?.activeRunId).toBe(latest?.id);
    expect(job?.data.data).toEqual({ runId: latest?.id });
  });

  it('pins the run to the version the event names', async () => {
    const seeded = await seedLiveConversation(testbed, triggerFlow());
    await republish(testbed, seeded, triggerFlow());

    const { run } = await receiveMessage(testbed, seeded, seeded.versionId);

    expect(run?.versionId).toBe(seeded.versionId);
  });

  it('starts nothing for a message that an earlier run already covered', async () => {
    const seeded = await seedLiveConversation(testbed, triggerFlow());
    const { message, run } = await receiveMessage(testbed, seeded);
    await testbed.executeRun.execute(seeded.ctx, { runId: String(run?.id) });

    const repeated = await testbed.startRunOnMessage.execute(seeded.ctx, {
      conversationId: seeded.conversation.id,
      messageId: message.id,
      agentId: seeded.conversation.agentId,
      mode: seeded.conversation.mode,
    });

    const { conversation, latest } = await readLifecycle(testbed, seeded);
    expect(repeated).toBeNull();
    expect(latest?.id).toBe(run?.id);
    expect(conversation?.activeRunId).toBeNull();
  });
});
