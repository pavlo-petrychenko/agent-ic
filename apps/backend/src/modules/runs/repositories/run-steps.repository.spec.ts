import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RunStepStatus } from '@/modules/runs/constants/run.constants';
import type { NewRunStep, RunStepResult } from '@/modules/runs/typedefs/run-step.typedefs';
import type { NewRun } from '@/modules/runs/typedefs/run.typedefs';
import { ROW_LEVEL_SECURITY_VIOLATION } from '@test/support/constants/postgres-errors.constants';
import {
  RUNS_TEST_END,
  RUNS_TEST_LATER,
  TEST_ERROR_PORT,
  TEST_OTHER_NODE_ID,
  TEST_OTHER_NODE_KEY,
  TEST_PARALLEL_BRANCH_KEY,
  TEST_RETRY_INPUT,
  TEST_RUN_FAILURE,
  TEST_STEP_OUTPUT,
  TEST_STEP_PORT,
} from '@test/support/constants/runs-testing.constants';
import { newRunStep } from '@test/support/fixtures/runs.fixture';
import { createRunsTestbed, seedRun } from '@test/support/helpers/runs-testing.helpers';
import type { RunsTestbed } from '@test/support/typedefs/runs-testing.typedefs';

const SUCCEEDED: RunStepResult = {
  status: RunStepStatus.Succeeded,
  output: TEST_STEP_OUTPUT,
  port: TEST_STEP_PORT,
  error: null,
  finishedAt: RUNS_TEST_END,
};

const FAILED: RunStepResult = {
  status: RunStepStatus.Failed,
  output: null,
  port: TEST_ERROR_PORT,
  error: TEST_RUN_FAILURE,
  finishedAt: RUNS_TEST_END,
};

describe('RunStepsRepository', () => {
  let testbed: RunsTestbed;

  const startIn = (run: NewRun, step: NewRunStep) =>
    testbed.tenants.run(run.workspaceId, () => testbed.steps.start(step));

  const listOf = (run: NewRun) =>
    testbed.tenants.run(run.workspaceId, () => testbed.steps.listByRun(run.workspaceId, run.id));

  beforeAll(async () => {
    testbed = await createRunsTestbed();
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('starts a step as its first attempt', async () => {
    const run = await seedRun(testbed);
    const step = newRunStep(testbed, run);

    const started = await startIn(run, step);

    expect(started).toEqual({
      ...step,
      status: RunStepStatus.Running,
      attempt: 1,
      output: null,
      port: null,
      error: null,
      finishedAt: null,
    });
  });

  describe('the step key', () => {
    it('restarts a step left running as the next attempt of the same row', async () => {
      const run = await seedRun(testbed);
      const first = newRunStep(testbed, run);
      await startIn(run, first);

      const retried = await startIn(
        run,
        newRunStep(testbed, run, { input: TEST_RETRY_INPUT, startedAt: RUNS_TEST_LATER }),
      );

      expect(retried).toMatchObject({
        id: first.id,
        attempt: 2,
        input: TEST_RETRY_INPUT,
        startedAt: RUNS_TEST_LATER,
      });
      expect(await listOf(run)).toHaveLength(1);
    });

    it('never restarts a finished step', async () => {
      const run = await seedRun(testbed);
      const first = newRunStep(testbed, run);
      await startIn(run, first);
      await testbed.tenants.run(run.workspaceId, () =>
        testbed.steps.finish(run.workspaceId, first.id, SUCCEEDED),
      );

      const retried = await startIn(
        run,
        newRunStep(testbed, run, { input: TEST_RETRY_INPUT, startedAt: RUNS_TEST_LATER }),
      );

      expect(retried).toBeNull();
      expect(await listOf(run)).toEqual([
        expect.objectContaining({ ...SUCCEEDED, id: first.id, attempt: 1, input: first.input }),
      ]);
    });

    it('keeps a node apart per branch and per run', async () => {
      const run = await seedRun(testbed);
      const otherRun = await seedRun(testbed, run.workspaceId);

      await startIn(run, newRunStep(testbed, run));
      await startIn(run, newRunStep(testbed, run, { branchKey: TEST_PARALLEL_BRANCH_KEY }));
      await startIn(otherRun, newRunStep(testbed, otherRun));

      expect(await listOf(run)).toHaveLength(2);
      expect(await listOf(otherRun)).toHaveLength(1);
    });
  });

  it('finishes a running step once', async () => {
    const run = await seedRun(testbed);
    const step = newRunStep(testbed, run);
    await startIn(run, step);

    const outcome = await testbed.tenants.run(run.workspaceId, async () => ({
      failed: await testbed.steps.finish(run.workspaceId, step.id, FAILED),
      succeeded: await testbed.steps.finish(run.workspaceId, step.id, SUCCEEDED),
    }));

    expect(outcome).toEqual({ failed: true, succeeded: false });
    expect(await listOf(run)).toEqual([expect.objectContaining(FAILED)]);
  });

  it('lists the steps of a run in the order they started', async () => {
    const run = await seedRun(testbed);
    const later = newRunStep(testbed, run, {
      nodeId: TEST_OTHER_NODE_ID,
      nodeKey: TEST_OTHER_NODE_KEY,
      startedAt: RUNS_TEST_LATER,
    });
    const earlier = newRunStep(testbed, run);
    await startIn(run, later);
    await startIn(run, earlier);

    const steps = await listOf(run);

    expect(steps.map((step) => step.id)).toEqual([earlier.id, later.id]);
  });

  describe('across tenants', () => {
    it('never shows or finishes the steps of another workspace', async () => {
      const run = await seedRun(testbed);
      const step = newRunStep(testbed, run);
      await startIn(run, step);

      const fromOther = await testbed.tenants.run(testbed.ids.generate(), async () => ({
        list: await testbed.steps.listByRun(run.workspaceId, run.id),
        finished: await testbed.steps.finish(run.workspaceId, step.id, SUCCEEDED),
      }));

      expect(fromOther).toEqual({ list: [], finished: false });
      expect(await listOf(run)).toEqual([
        expect.objectContaining({ status: RunStepStatus.Running }),
      ]);
    });

    it('shows nothing without a tenant', async () => {
      const run = await seedRun(testbed);
      await startIn(run, newRunStep(testbed, run));

      expect(await testbed.steps.listByRun(run.workspaceId, run.id)).toEqual([]);
    });

    it('refuses to start a step in another workspace', async () => {
      const run = await seedRun(testbed);

      const write = testbed.tenants.run(testbed.ids.generate(), () =>
        testbed.steps.start(newRunStep(testbed, run)),
      );

      await expect(write).rejects.toMatchObject(ROW_LEVEL_SECURITY_VIOLATION);
    });
  });
});
