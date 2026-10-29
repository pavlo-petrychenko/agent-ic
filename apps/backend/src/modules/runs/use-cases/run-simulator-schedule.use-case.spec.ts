import { IdPrefix, WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ConversationNotFoundError } from '@/modules/conversations';
import { RunTrigger } from '@/modules/runs/constants/run.constants';
import { ScheduleConditionKind } from '@/modules/runs/constants/schedule-tick.constants';
import { ScheduleNeedsCustomerMessageError } from '@/modules/runs/errors/schedule-needs-customer-message.error';
import { ScheduleRunBusyError } from '@/modules/runs/errors/schedule-run-busy.error';
import { ScheduleTriggerNotFoundError } from '@/modules/runs/errors/schedule-trigger-not-found.error';
import { RunSimulatorScheduleUseCase } from '@/modules/runs/use-cases/run-simulator-schedule.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TEST_NODE_ID } from '@test/support/constants/agents-testing.constants';
import { RETRYABLE_ATTEMPT } from '@test/support/constants/async-jobs.constants';
import {
  FIRST_STEP_ID,
  FIRST_STEP_KEY,
  SCHEDULE_NODE_ID,
} from '@test/support/constants/runs-testing.constants';
import { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import {
  agentNode,
  flowEdge,
  scheduleTriggerNode,
  stepFlow,
} from '@test/support/fixtures/runs.fixture';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import {
  createRunLifecycleTestbed,
  markCustomerSilentSince,
  receiveMessage,
  seedLiveConversation,
  turnIntoSimulation,
} from '@test/support/helpers/runs-testing.helpers';
import type {
  LiveConversation,
  RunLifecycleTestbed,
} from '@test/support/typedefs/runs-testing.typedefs';

const scheduledFlow = stepFlow(
  [scheduleTriggerNode(), agentNode(FIRST_STEP_ID, FIRST_STEP_KEY)],
  [flowEdge(TEST_NODE_ID, FIRST_STEP_ID), flowEdge(SCHEDULE_NODE_ID, FIRST_STEP_ID)],
);

describe('RunSimulatorScheduleUseCase', () => {
  let testbed: RunLifecycleTestbed;
  let runSchedule: RunSimulatorScheduleUseCase;

  beforeAll(async () => {
    testbed = await createRunLifecycleTestbed(TestRedisPrefix.SimulatorSchedule);
    runSchedule = testbed.module.get(RunSimulatorScheduleUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  const testerOf = ({ conversation }: LiveConversation): UseCaseCtx =>
    workspaceCtx(conversation.endUserExternalId, conversation.workspaceId, WorkspaceRole.Owner);

  const simulatorChat = async (answered = true): Promise<LiveConversation> => {
    const seeded = await seedLiveConversation(testbed, scheduledFlow);
    if (answered) {
      const { run } = await receiveMessage(testbed, seeded);
      await testbed.executeRun.execute(seeded.ctx, { runId: String(run?.id) }, RETRYABLE_ATTEMPT);
      await markCustomerSilentSince(testbed, seeded, testbed.clock.now());
    }
    await turnIntoSimulation(testbed, seeded);
    return seeded;
  };

  const run = (seeded: LiveConversation, nodeId: string = SCHEDULE_NODE_ID) =>
    runSchedule.execute(testerOf(seeded), {
      conversationId: testbed.ids.toPublic(IdPrefix.Conversation, seeded.conversation.id),
      nodeId,
    });

  it('starts a schedule run now and shows each condition as a check', async () => {
    const seeded = await simulatorChat();

    const started = await run(seeded);

    expect(started.run).toMatchObject({
      trigger: RunTrigger.Schedule,
      conversationId: testbed.ids.toPublic(IdPrefix.Conversation, seeded.conversation.id),
    });
    expect(started.conditions).toEqual([
      { kind: ScheduleConditionKind.CustomerWrote, met: true },
      { kind: ScheduleConditionKind.NotEscalated, met: true },
      { kind: ScheduleConditionKind.ChannelType, met: true },
    ]);
  });

  it('refuses while a run is in progress', async () => {
    const seeded = await simulatorChat();
    await run(seeded);

    await expect(run(seeded)).rejects.toBeInstanceOf(ScheduleRunBusyError);
  });

  it('needs one customer message first', async () => {
    const seeded = await simulatorChat(false);

    await expect(run(seeded)).rejects.toBeInstanceOf(ScheduleNeedsCustomerMessageError);
  });

  it('refuses a node that is not a schedule trigger', async () => {
    const seeded = await simulatorChat();

    await expect(run(seeded, TEST_NODE_ID)).rejects.toBeInstanceOf(ScheduleTriggerNotFoundError);
  });

  it('never runs the chat of another tester', async () => {
    const seeded = await simulatorChat();
    const other = workspaceCtx(
      testbed.ids.generate(),
      seeded.conversation.workspaceId,
      WorkspaceRole.Owner,
    );

    await expect(
      runSchedule.execute(other, {
        conversationId: testbed.ids.toPublic(IdPrefix.Conversation, seeded.conversation.id),
        nodeId: SCHEDULE_NODE_ID,
      }),
    ).rejects.toBeInstanceOf(ConversationNotFoundError);
  });
});
