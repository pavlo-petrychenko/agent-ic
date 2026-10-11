import { IdPrefix, WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ConversationMode, ConversationRunsService, MessageAuthor } from '@/modules/conversations';
import { RunStatus, RunStepStatus } from '@/modules/runs/constants/run.constants';
import { RunNotFoundError } from '@/modules/runs/errors/run-not-found.error';
import { GetRunUseCase } from '@/modules/runs/use-cases/get-run.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { TEST_NODE_ID } from '@test/support/constants/agents-testing.constants';
import {
  FIRST_STEP_ID,
  FIRST_STEP_KEY,
  SECOND_STEP_ID,
  SECOND_STEP_KEY,
  TEST_AGENT_REPLY,
} from '@test/support/constants/runs-testing.constants';
import { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import { agentNode, flowEdge, stepFlow } from '@test/support/fixtures/runs.fixture';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import { createRunsTestbed, seedExecutableRun } from '@test/support/helpers/runs-testing.helpers';
import type {
  ExecutableRun,
  RunExecutionTestbed,
} from '@test/support/typedefs/runs-testing.typedefs';

const oneOfTwoSteps = stepFlow(
  [agentNode(FIRST_STEP_ID, FIRST_STEP_KEY), agentNode(SECOND_STEP_ID, SECOND_STEP_KEY)],
  [flowEdge(TEST_NODE_ID, FIRST_STEP_ID)],
);

describe('GetRunUseCase', () => {
  let testbed: RunExecutionTestbed;
  let getRun: GetRunUseCase;

  const seedSimulation = (): Promise<ExecutableRun> =>
    seedExecutableRun(testbed, oneOfTwoSteps, [], ConversationMode.Simulation);

  const read = (workspaceId: string, { run }: ExecutableRun, role = WorkspaceRole.Builder) =>
    getRun.execute(workspaceCtx(testbed.ids.generate(), workspaceId, role), {
      id: testbed.ids.toPublic(IdPrefix.Run, run.id),
    });

  beforeAll(async () => {
    testbed = await createRunsTestbed(TestRedisPrefix.RunDetails);
    getRun = testbed.module.get(GetRunUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('returns the steps with status, output and duration, and the run totals', async () => {
    const seeded = await seedSimulation();
    const { run, ctx } = seeded;
    await testbed.execution.execute(ctx, run.workspaceId, run.id);
    await testbed.tenants.run(run.workspaceId, () =>
      testbed.module.get(ConversationRunsService).recordOutbound(ctx, {
        workspaceId: run.workspaceId,
        conversationId: run.conversationId,
        key: testbed.ids.generate(),
        author: MessageAuthor.Agent,
        text: TEST_AGENT_REPLY,
        quickReplies: [],
        runId: run.id,
      }),
    );

    const details = await read(run.workspaceId, seeded);

    expect(details).toMatchObject({
      id: testbed.ids.toPublic(IdPrefix.Run, run.id),
      conversationId: testbed.ids.toPublic(IdPrefix.Conversation, run.conversationId),
      status: RunStatus.Succeeded,
      durationMs: 0,
      totals: { stepsRun: 2, stepsInFlow: 3, messagesSent: 1 },
    });
    const succeeded = { status: RunStepStatus.Succeeded, durationMs: 0 };
    expect(details.steps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ...succeeded, nodeId: TEST_NODE_ID }),
        expect.objectContaining({
          ...succeeded,
          nodeId: FIRST_STEP_ID,
          nodeKey: FIRST_STEP_KEY,
          output: { answer: FIRST_STEP_KEY },
        }),
      ]),
    );
  });

  it('does not find a run of another workspace', async () => {
    const seeded = await seedSimulation();

    await expect(read(testbed.ids.generate(), seeded)).rejects.toBeInstanceOf(RunNotFoundError);
  });

  it('does not show a live run, which belongs to the Inbox', async () => {
    const seeded = await seedExecutableRun(testbed, oneOfTwoSteps);

    await expect(read(seeded.run.workspaceId, seeded)).rejects.toBeInstanceOf(RunNotFoundError);
  });

  it('refuses an operator', async () => {
    const seeded = await seedSimulation();

    const attempt = read(seeded.run.workspaceId, seeded, WorkspaceRole.Operator);

    await expect(attempt).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
