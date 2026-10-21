import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { UsageThreshold } from '@/modules/usage/constants/usage.constants';
import { UsageCountersRepository } from '@/modules/usage/repositories/usage-counters.repository';
import type { UsageCounter } from '@/modules/usage/typedefs/usage.typedefs';
import {
  USAGE_TEST_PERIOD,
  USAGE_TEST_START,
} from '@test/support/constants/usage-testing.constants';
import { MissingTestDataError } from '@test/support/errors/missing-test-data.error';
import { createUsageTestbed } from '@test/support/helpers/usage-testing.helpers';
import type { UsageTestbed } from '@test/support/typedefs/usage-testing.typedefs';

describe('UsageCountersRepository', () => {
  let testbed: UsageTestbed;
  let counters: UsageCountersRepository;

  beforeAll(async () => {
    testbed = await createUsageTestbed();
    counters = testbed.module.get(UsageCountersRepository);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  const keyOf = (workspaceId: string) => ({
    id: testbed.ids.generate(),
    workspaceId,
    period: USAGE_TEST_PERIOD,
    at: USAGE_TEST_START,
  });

  const addCredits = (workspaceId: string, credits: number): Promise<UsageCounter | null> =>
    testbed.tenants.run(workspaceId, () => counters.addCredits(keyOf(workspaceId), credits));

  it('keeps one row per workspace and month and adds to it', async () => {
    const workspaceId = testbed.ids.generate();
    const first = await addCredits(workspaceId, 0.1234);

    const second = await addCredits(workspaceId, 1.5);
    await testbed.tenants.run(workspaceId, () => counters.addConversation(keyOf(workspaceId)));

    expect(second).toMatchObject({ id: first?.id, credits: 1.6234 });
    expect(
      await testbed.tenants.run(workspaceId, () => counters.find(workspaceId, USAGE_TEST_PERIOD)),
    ).toMatchObject({ id: first?.id, credits: 1.6234, conversations: 1 });
  });

  it('marks a threshold only once', async () => {
    const workspaceId = testbed.ids.generate();
    const counter = await addCredits(workspaceId, 1);
    if (counter === null) {
      throw new MissingTestDataError(workspaceId);
    }

    const first = await testbed.tenants.run(workspaceId, () =>
      counters.markWarned(counter, UsageThreshold.Warn, USAGE_TEST_START),
    );
    const again = await testbed.tenants.run(workspaceId, () =>
      counters.markWarned(counter, UsageThreshold.Warn, USAGE_TEST_START),
    );

    expect(first).toMatchObject({ warned80At: USAGE_TEST_START, warned100At: null });
    expect(again).toBeNull();
  });

  it('shows nothing of one workspace to another', async () => {
    const workspaceId = testbed.ids.generate();
    const otherWorkspaceId = testbed.ids.generate();
    await addCredits(workspaceId, 3);

    const seen = await testbed.tenants.run(otherWorkspaceId, () =>
      counters.find(workspaceId, USAGE_TEST_PERIOD),
    );

    expect(seen).toBeNull();
  });
});
