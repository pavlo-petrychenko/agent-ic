import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { NewRun } from '@/modules/runs/typedefs/run.typedefs';
import {
  CHECK_VIOLATION,
  FOREIGN_KEY_VIOLATION,
  ROW_LEVEL_SECURITY_VIOLATION,
} from '@test/support/constants/postgres-errors.constants';
import {
  RUNS_TEST_END,
  RUNS_TEST_LATER,
  RUNS_TEST_START,
  TEST_OTHER_NODE_ID,
} from '@test/support/constants/runs-testing.constants';
import { newInactivityTimer } from '@test/support/fixtures/runs.fixture';
import { createRunsTestbed, seedRun } from '@test/support/helpers/runs-testing.helpers';
import type { RunExecutionTestbed } from '@test/support/typedefs/runs-testing.typedefs';

describe('InactivityTimersRepository', () => {
  let testbed: RunExecutionTestbed;

  const find = (run: NewRun) =>
    testbed.tenants.run(run.workspaceId, () =>
      testbed.timers.findByConversation(run.workspaceId, run.conversationId),
    );

  beforeAll(async () => {
    testbed = await createRunsTestbed();
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('arms a timer for a conversation and stamps both row times from the clock', async () => {
    const run = await seedRun(testbed);
    const timer = newInactivityTimer(testbed, run);

    const armed = await testbed.tenants.run(run.workspaceId, () => testbed.timers.arm(timer));

    expect(armed).toEqual({
      ...timer,
      leaseUntil: null,
      createdAt: RUNS_TEST_START,
      updatedAt: RUNS_TEST_START,
    });
    expect(await find(run)).toEqual(armed);
  });

  it('re-arms the same row for the conversation and clears its lease', async () => {
    const run = await seedRun(testbed);
    const first = newInactivityTimer(testbed, run);
    await testbed.tenants.run(run.workspaceId, () => testbed.timers.arm(first));
    testbed.clock.advanceBy(RUNS_TEST_END.getTime() - RUNS_TEST_START.getTime());

    const second = newInactivityTimer(testbed, run, {
      nodeId: TEST_OTHER_NODE_ID,
      attempt: 1,
      anchorAt: RUNS_TEST_LATER,
      dueAt: null,
    });
    const rearmed = await testbed.tenants.run(run.workspaceId, () => testbed.timers.arm(second));

    expect(rearmed).toEqual({
      ...second,
      id: first.id,
      leaseUntil: null,
      createdAt: RUNS_TEST_START,
      updatedAt: RUNS_TEST_END,
    });
  });

  it('keeps a timer with no due time, which the sweep skips', async () => {
    const run = await seedRun(testbed);

    await testbed.tenants.run(run.workspaceId, () =>
      testbed.timers.arm(newInactivityTimer(testbed, run, { dueAt: null })),
    );

    expect(await find(run)).toMatchObject({ dueAt: null });
  });

  it('finds nothing for a conversation without a timer', async () => {
    const run = await seedRun(testbed);

    expect(await find(run)).toBeNull();
  });

  it('disarms the timer of a conversation and reports whether one existed', async () => {
    const run = await seedRun(testbed);
    await testbed.tenants.run(run.workspaceId, () =>
      testbed.timers.arm(newInactivityTimer(testbed, run)),
    );
    const disarm = () =>
      testbed.tenants.run(run.workspaceId, () =>
        testbed.timers.disarm(run.workspaceId, run.conversationId),
      );

    expect(await disarm()).toBe(true);
    expect(await find(run)).toBeNull();
    expect(await disarm()).toBe(false);
  });

  it('refuses a negative attempt', async () => {
    const run = await seedRun(testbed);

    const write = testbed.tenants.run(run.workspaceId, () =>
      testbed.timers.arm(newInactivityTimer(testbed, run, { attempt: -1 })),
    );

    await expect(write).rejects.toMatchObject(CHECK_VIOLATION);
  });

  it('refuses a timer for a conversation that does not exist', async () => {
    const run = await seedRun(testbed);

    const write = testbed.tenants.run(run.workspaceId, () =>
      testbed.timers.arm(
        newInactivityTimer(testbed, run, { conversationId: testbed.ids.generate() }),
      ),
    );

    await expect(write).rejects.toMatchObject(FOREIGN_KEY_VIOLATION);
  });

  it('hides the timers of one workspace from another', async () => {
    const run = await seedRun(testbed);
    await testbed.tenants.run(run.workspaceId, () =>
      testbed.timers.arm(newInactivityTimer(testbed, run)),
    );

    const seen = await testbed.tenants.run(testbed.ids.generate(), () =>
      testbed.timers.findByConversation(run.workspaceId, run.conversationId),
    );

    expect(seen).toBeNull();
  });

  it('refuses to arm a timer in another workspace', async () => {
    const run = await seedRun(testbed);

    const write = testbed.tenants.run(testbed.ids.generate(), () =>
      testbed.timers.arm(newInactivityTimer(testbed, run)),
    );

    await expect(write).rejects.toMatchObject(ROW_LEVEL_SECURITY_VIOLATION);
  });
});
