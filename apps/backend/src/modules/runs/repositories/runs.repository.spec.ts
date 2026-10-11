import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RunStatus } from '@/modules/runs/constants/run.constants';
import type { RunEnd } from '@/modules/runs/typedefs/run.typedefs';
import { ROW_LEVEL_SECURITY_VIOLATION } from '@test/support/constants/postgres-errors.constants';
import {
  RUNS_TEST_END,
  RUNS_TEST_LATER,
  TEST_RUN_FAILURE,
} from '@test/support/constants/runs-testing.constants';
import { newRun } from '@test/support/fixtures/runs.fixture';
import { createRunsTestbed, seedRun } from '@test/support/helpers/runs-testing.helpers';
import type { RunsTestbed } from '@test/support/typedefs/runs-testing.typedefs';

describe('RunsRepository', () => {
  let testbed: RunsTestbed;

  beforeAll(async () => {
    testbed = await createRunsTestbed();
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('stores a queued run and finds it by id', async () => {
    const run = await seedRun(testbed);

    const stored = await testbed.tenants.run(run.workspaceId, () =>
      testbed.runs.findById(run.workspaceId, run.id),
    );

    expect(stored).toEqual({
      ...run,
      error: null,
      traceId: null,
      startedAt: null,
      finishedAt: null,
    });
  });

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
