import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { MessageAuthor } from '@/modules/conversations';
import { RunStatus, RunTrigger, TriggeredRunOutcome } from '@/modules/runs/constants/run.constants';
import { executeProactiveRunJob } from '@/modules/runs/jobs/execute-proactive-run.job';
import { RunLifecycleService } from '@/modules/runs/services/run-lifecycle.service';
import type { TriggeredRun } from '@/modules/runs/typedefs/run-start.typedefs';
import { DETACHED_TRACE_CONTEXT } from '@/platform/queues/constants/job.constants';
import { JobHandlersService } from '@/platform/queues/services/job-handlers.service';
import { RETRYABLE_ATTEMPT } from '@test/support/constants/async-jobs.constants';
import {
  FIRST_STEP_ID,
  FIRST_STEP_KEY,
  SCHEDULE_NODE_ID,
  TEST_TRIGGER_INPUT,
} from '@test/support/constants/runs-testing.constants';
import { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import {
  agentNode,
  flowEdge,
  scheduleTriggerNode,
  stepFlow,
} from '@test/support/fixtures/runs.fixture';
import {
  addConversationMessage,
  createRunLifecycleTestbed,
  markConversationWaiting,
  readLifecycle,
  receiveMessage,
  seedLiveConversation,
} from '@test/support/helpers/runs-testing.helpers';
import type {
  LiveConversation,
  RunLifecycleTestbed,
} from '@test/support/typedefs/runs-testing.typedefs';

const scheduledFlow = stepFlow(
  [scheduleTriggerNode(), agentNode(FIRST_STEP_ID, FIRST_STEP_KEY)],
  [flowEdge(SCHEDULE_NODE_ID, FIRST_STEP_ID)],
);

describe('RunLifecycleService.startTriggeredRun', () => {
  let testbed: RunLifecycleTestbed;
  let lifecycle: RunLifecycleService;

  const answeredConversation = async (): Promise<LiveConversation> => {
    const seeded = await seedLiveConversation(testbed, scheduledFlow);
    const { run } = await receiveMessage(testbed, seeded);
    await testbed.executeRun.execute(seeded.ctx, { runId: String(run?.id) }, RETRYABLE_ATTEMPT);
    return seeded;
  };

  const startTriggered = ({
    conversation,
    versionId,
    ctx,
  }: LiveConversation): Promise<TriggeredRun> =>
    testbed.tenants.run(conversation.workspaceId, () =>
      lifecycle.startTriggeredRun(ctx, {
        workspaceId: conversation.workspaceId,
        conversationId: conversation.id,
        versionId,
        trigger: RunTrigger.Schedule,
        triggerNodeId: SCHEDULE_NODE_ID,
        triggerInput: TEST_TRIGGER_INPUT,
      }),
    );

  beforeAll(async () => {
    testbed = await createRunLifecycleTestbed(TestRedisPrefix.RunTriggered);
    lifecycle = testbed.module.get(RunLifecycleService);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('claims an idle conversation, covers its latest message and queues a proactive run in its own trace', async () => {
    const seeded = await answeredConversation();
    const reply = await addConversationMessage(testbed, seeded, MessageAuthor.Agent);

    const started = await startTriggered(seeded);

    const { conversation, latest } = await readLifecycle(testbed, seeded);
    const job = await testbed.queues.get(executeProactiveRunJob.queue).getJob(String(latest?.id));
    expect(started).toEqual({ outcome: TriggeredRunOutcome.Started, run: expect.anything() });
    expect(latest).toMatchObject({
      versionId: seeded.versionId,
      trigger: RunTrigger.Schedule,
      triggerNodeId: SCHEDULE_NODE_ID,
      triggerInput: TEST_TRIGGER_INPUT,
      status: RunStatus.Queued,
      lastCoveredMessageId: reply.id,
    });
    expect(conversation?.activeRunId).toBe(latest?.id);
    expect(job?.name).toBe(executeProactiveRunJob.name);
    expect(job?.data.data).toEqual({ runId: latest?.id });
    expect(job?.data.traceContext).toEqual(DETACHED_TRACE_CONTEXT);
    const { queue, name } = executeProactiveRunJob;
    expect(testbed.module.get(JobHandlersService).find(queue, name)).not.toBeNull();
  });

  it('is busy while a run holds the conversation', async () => {
    const seeded = await seedLiveConversation(testbed, scheduledFlow);
    const { run } = await receiveMessage(testbed, seeded);

    expect(await startTriggered(seeded)).toEqual({ outcome: TriggeredRunOutcome.Busy });

    expect((await readLifecycle(testbed, seeded)).latest?.id).toBe(run?.id);
  });

  it('is busy while a customer message waits for its own run', async () => {
    const seeded = await answeredConversation();
    await addConversationMessage(testbed, seeded, MessageAuthor.Customer);
    const before = await readLifecycle(testbed, seeded);

    expect(await startTriggered(seeded)).toEqual({ outcome: TriggeredRunOutcome.Busy });

    expect(await readLifecycle(testbed, seeded)).toEqual(before);
  });

  it('is busy when the conversation waits for an operator', async () => {
    const seeded = await answeredConversation();
    await markConversationWaiting(testbed, seeded);

    expect(await startTriggered(seeded)).toEqual({ outcome: TriggeredRunOutcome.Busy });
  });

  it('answers a customer who wrote during the triggered run with a message run after it', async () => {
    const seeded = await answeredConversation();
    const started = await startTriggered(seeded);
    const triggeredId = started.outcome === TriggeredRunOutcome.Started ? started.run.id : null;
    const { message } = await receiveMessage(testbed, seeded);

    await testbed.executeRun.execute(seeded.ctx, { runId: String(triggeredId) }, RETRYABLE_ATTEMPT);

    const { conversation, latest } = await readLifecycle(testbed, seeded);
    expect(latest).toMatchObject({
      trigger: RunTrigger.Message,
      triggerNodeId: null,
      lastCoveredMessageId: message.id,
    });
    expect(latest?.id).not.toBe(triggeredId);
    expect(conversation?.activeRunId).toBe(latest?.id);
  });
});
