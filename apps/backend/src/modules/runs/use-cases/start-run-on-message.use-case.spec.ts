import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RunStatus } from '@/modules/runs/constants/run.constants';
import { executeRunJob } from '@/modules/runs/jobs/execute-run.job';
import { StartRunOnMessageUseCase } from '@/modules/runs/use-cases/start-run-on-message.use-case';
import { JobHandlersService } from '@/platform/queues/services/job-handlers.service';
import { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import { triggerOnlyFlow } from '@test/support/fixtures/runs.fixture';
import {
  createRunLifecycleTestbed,
  readLifecycle,
  receiveMessage,
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
    const seeded = await seedLiveConversation(testbed, triggerOnlyFlow());

    const { message } = await receiveMessage(testbed, seeded);

    const { conversation, latest } = await readLifecycle(testbed, seeded);
    const job = await testbed.queues.get(executeRunJob.queue).getJob(String(latest?.id));
    expect(latest).toMatchObject({
      versionId: seeded.versionId,
      status: RunStatus.Queued,
      lastCoveredMessageId: message.id,
    });
    expect(conversation?.activeRunId).toBe(latest?.id);
    expect(job?.data.data).toEqual({ runId: latest?.id });
    const { queue, name } = executeRunJob;
    expect(testbed.module.get(JobHandlersService).find(queue, name)).not.toBeNull();
  });

  it('starts nothing for a message that an earlier run already covered', async () => {
    const seeded = await seedLiveConversation(testbed, triggerOnlyFlow());
    const { message, run } = await receiveMessage(testbed, seeded);
    await testbed.executeRun.execute(seeded.ctx, { runId: String(run?.id) });

    const { id: conversationId, agentId, mode } = seeded.conversation;
    const repeat = { conversationId, messageId: message.id, agentId, mode };
    const repeated = await testbed.module.get(StartRunOnMessageUseCase).execute(seeded.ctx, repeat);

    const { conversation, latest } = await readLifecycle(testbed, seeded);
    expect(repeated).toBeNull();
    expect(latest?.id).toBe(run?.id);
    expect(conversation?.activeRunId).toBeNull();
  });
});
