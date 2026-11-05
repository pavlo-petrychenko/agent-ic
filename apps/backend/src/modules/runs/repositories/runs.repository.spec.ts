import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RunStatus, RunTrigger } from '@/modules/runs/constants/run.constants';
import type { NewRun, RunEnd } from '@/modules/runs/typedefs/run.typedefs';
import {
  CHECK_VIOLATION,
  ROW_LEVEL_SECURITY_VIOLATION,
} from '@test/support/constants/postgres-errors.constants';
import {
  RUNS_TEST_END,
  RUNS_TEST_LATER,
  SCHEDULE_NODE_ID,
  TEST_RUN_FAILURE,
  TEST_TRIGGER_INPUT,
} from '@test/support/constants/runs-testing.constants';
import { newRun } from '@test/support/fixtures/runs.fixture';
import { ensureRunParents } from '@test/support/helpers/parent-rows.helpers';
import { createRunsTestbed, seedRun } from '@test/support/helpers/runs-testing.helpers';
import type { RunExecutionTestbed } from '@test/support/typedefs/runs-testing.typedefs';

describe('RunsRepository', () => {
  let testbed: RunExecutionTestbed;

  beforeAll(async () => {
    testbed = await createRunsTestbed();
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('stores a queued run, stamps createdAt and finds it by id', async () => {
    const run = await seedRun(testbed);

    const stored = await testbed.tenants.run(run.workspaceId, () =>
      testbed.runs.findById(run.workspaceId, run.id),
    );

    expect(stored).toEqual({
      ...run,
      triggerNodeId: null,
      triggerInput: null,
      error: null,
      traceId: null,
      startedAt: null,
      finishedAt: null,
      createdAt: testbed.clock.now(),
    });
  });

  it('stores a triggered run with its trigger node and input', async () => {
    const run: NewRun = {
      ...newRun(testbed, testbed.ids.generate()),
      trigger: RunTrigger.Schedule,
      triggerNodeId: SCHEDULE_NODE_ID,
      triggerInput: TEST_TRIGGER_INPUT,
    };
    await ensureRunParents(testbed.module, run);

    const stored = await testbed.tenants.run(run.workspaceId, async () => {
      await testbed.runs.insert(run);
      return testbed.runs.findById(run.workspaceId, run.id);
    });

    expect(stored).toMatchObject({
      trigger: RunTrigger.Schedule,
      triggerNodeId: SCHEDULE_NODE_ID,
      triggerInput: TEST_TRIGGER_INPUT,
    });
  });

  it.each([
    [RunTrigger.Schedule, null, null],
    [RunTrigger.Inactivity, null, TEST_TRIGGER_INPUT],
    [RunTrigger.Message, SCHEDULE_NODE_ID, null],
    [RunTrigger.Message, null, TEST_TRIGGER_INPUT],
  ])(
    'refuses a %s run with trigger node %s and input %o',
    async (trigger, triggerNodeId, triggerInput) => {
      const run: NewRun = {
        ...newRun(testbed, testbed.ids.generate()),
        trigger,
        triggerNodeId,
        triggerInput,
      };
      await ensureRunParents(testbed.module, run);

      const write = testbed.tenants.run(run.workspaceId, () => testbed.runs.insert(run));

      await expect(write).rejects.toMatchObject(CHECK_VIOLATION);
    },
  );

  it('starts a queued run only once', async () => {
    const { id, workspaceId } = await seedRun(testbed);

    const outcome = await testbed.tenants.run(workspaceId, async () => ({
      first: await testbed.runs.markRunning(workspaceId, id, RUNS_TEST_LATER),
      second: await testbed.runs.markRunning(workspaceId, id, RUNS_TEST_END),
      stored: await testbed.runs.findById(workspaceId, id),
    }));

    expect(outcome).toMatchObject({
      first: true,
      second: false,
      stored: { status: RunStatus.Running, startedAt: RUNS_TEST_LATER },
    });
  });

  it('keeps the first end of a run', async () => {
    const { id, workspaceId } = await seedRun(testbed);
    const failure: RunEnd = {
      status: RunStatus.Failed,
      error: TEST_RUN_FAILURE,
      finishedAt: RUNS_TEST_END,
    };
    const success: RunEnd = {
      status: RunStatus.Succeeded,
      error: null,
      finishedAt: RUNS_TEST_LATER,
    };

    const outcome = await testbed.tenants.run(workspaceId, async () => ({
      started: await testbed.runs.markRunning(workspaceId, id, RUNS_TEST_LATER),
      failed: await testbed.runs.finish(workspaceId, id, failure),
      succeeded: await testbed.runs.finish(workspaceId, id, success),
      restarted: await testbed.runs.markRunning(workspaceId, id, RUNS_TEST_END),
      stored: await testbed.runs.findById(workspaceId, id),
    }));

    expect(outcome).toMatchObject({
      started: true,
      failed: true,
      succeeded: false,
      restarted: false,
      stored: failure,
    });
  });

  it('replaces the trace id of a run, clearing it for an attempt without a trace', async () => {
    const { id, workspaceId } = await seedRun(testbed);
    const sampled = testbed.ids.generate();

    const outcome = await testbed.tenants.run(workspaceId, async () => {
      await testbed.runs.setTraceId(workspaceId, id, sampled);
      const traced = await testbed.runs.findById(workspaceId, id);
      await testbed.runs.setTraceId(workspaceId, id, null);
      const untraced = await testbed.runs.findById(workspaceId, id);
      return { traced: traced?.traceId, untraced: untraced?.traceId };
    });

    expect(outcome).toEqual({ traced: sampled, untraced: null });
  });

  describe('across tenants', () => {
    it('never shows, starts or ends the run of another workspace', async () => {
      const { id, workspaceId } = await seedRun(testbed);
      const end: RunEnd = { status: RunStatus.Succeeded, error: null, finishedAt: RUNS_TEST_END };

      const fromOther = await testbed.tenants.run(testbed.ids.generate(), async () => ({
        found: await testbed.runs.findById(workspaceId, id),
        started: await testbed.runs.markRunning(workspaceId, id, RUNS_TEST_LATER),
        finished: await testbed.runs.finish(workspaceId, id, end),
      }));
      const stored = await testbed.tenants.run(workspaceId, () =>
        testbed.runs.findById(workspaceId, id),
      );

      expect(fromOther).toEqual({ found: null, started: false, finished: false });
      expect(stored?.status).toBe(RunStatus.Queued);
    });

    it('shows nothing without a tenant', async () => {
      const { id, workspaceId } = await seedRun(testbed);

      expect(await testbed.runs.findById(workspaceId, id)).toBeNull();
    });

    it('refuses to write a run into another workspace', async () => {
      const run = newRun(testbed, testbed.ids.generate());

      const write = testbed.tenants.run(testbed.ids.generate(), () => testbed.runs.insert(run));

      await expect(write).rejects.toMatchObject(ROW_LEVEL_SECURITY_VIOLATION);
    });
  });
});
