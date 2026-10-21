import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { UsageMetricName } from '@/modules/usage/constants/usage-metrics.constants';
import { UsageThreshold } from '@/modules/usage/constants/usage.constants';
import { EnvVar } from '@/platform/config/constants/env.constants';
import { LlmMessageRole } from '@/platform/llm/constants/llm-gateway.constants';
import { LlmModelId, LlmPurpose } from '@/platform/llm/constants/llm-model.constants';
import { LlmProviderKind } from '@/platform/llm/constants/llm-provider.constants';
import { UsageReporter } from '@/platform/llm/services/usage-reporter.service';
import type { LlmStepTimeouts } from '@/platform/llm/typedefs/llm-gateway.typedefs';
import { MetricsService } from '@/platform/observability/services/metrics.service';
import {
  USAGE_TEST_MONTH_MS,
  USAGE_TEST_NEXT_PERIOD,
} from '@test/support/constants/usage-testing.constants';
import { createLlmGateway } from '@test/support/helpers/llm-testing.helpers';
import {
  counterOf,
  createUsageTestbed,
  meteredReport,
  setWorkspaceLimits,
  thresholdEmailsQueued,
} from '@test/support/helpers/usage-testing.helpers';
import { startMockLlm } from '@test/support/services/mock-llm.service';
import type { MockLlmService } from '@test/support/services/mock-llm.service';
import type { UsageTestbed } from '@test/support/typedefs/usage-testing.typedefs';

const STEP_TIMEOUT_MS = 1_000;
const TIMEOUTS: LlmStepTimeouts = {
  [LlmPurpose.Conversation]: STEP_TIMEOUT_MS,
  [LlmPurpose.Light]: STEP_TIMEOUT_MS,
};
const HAND_COMPUTED_ROUND = { promptTokens: 2_000, completionTokens: 500 };
const HAND_COMPUTED_CREDITS = 0.45;

const byThreshold = (left: UsageThreshold, right: UsageThreshold): number => left - right;

describe('UsageReporterService', () => {
  let testbed: UsageTestbed;
  let reporter: UsageReporter;

  beforeAll(async () => {
    testbed = await createUsageTestbed();
    reporter = testbed.module.get(UsageReporter);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('adds every metered report to the counter of the month', async () => {
    const workspaceId = testbed.ids.generate();

    await reporter.report(meteredReport(workspaceId, 1.25));
    await reporter.report(meteredReport(workspaceId, 0.5));

    expect(await counterOf(testbed, workspaceId)).toMatchObject({
      credits: 1.75,
      conversations: 0,
    });
  });

  it('changes nothing for a call on the workspace key', async () => {
    const workspaceId = testbed.ids.generate();

    await reporter.report({
      ...meteredReport(workspaceId, 0),
      source: LlmProviderKind.Workspace,
      metered: false,
    });

    expect(await counterOf(testbed, workspaceId)).toBeNull();
  });

  it('starts a fresh counter in a new month', async () => {
    const workspaceId = testbed.ids.generate();
    await reporter.report(meteredReport(workspaceId, 3));
    testbed.clock.advanceBy(USAGE_TEST_MONTH_MS);

    await reporter.report(meteredReport(workspaceId, 2));

    testbed.clock.advanceBy(-USAGE_TEST_MONTH_MS);
    expect(await counterOf(testbed, workspaceId)).toMatchObject({ credits: 3 });
    expect(await counterOf(testbed, workspaceId, USAGE_TEST_NEXT_PERIOD)).toMatchObject({
      credits: 2,
    });
  });

  it('asks for one owner email at 80 and one at 100 percent of the limit', async () => {
    const workspaceId = testbed.ids.generate();

    await reporter.report(meteredReport(workspaceId, 7_000));
    expect(await thresholdEmailsQueued(testbed, workspaceId)).toEqual([]);

    await reporter.report(meteredReport(workspaceId, 1_500));
    await reporter.report(meteredReport(workspaceId, 100));
    expect(await thresholdEmailsQueued(testbed, workspaceId)).toEqual([UsageThreshold.Warn]);

    await reporter.report(meteredReport(workspaceId, 1_500));
    await reporter.report(meteredReport(workspaceId, 50));
    expect((await thresholdEmailsQueued(testbed, workspaceId)).sort(byThreshold)).toEqual([
      UsageThreshold.Warn,
      UsageThreshold.Limit,
    ]);
    expect(await counterOf(testbed, workspaceId)).toMatchObject({
      warned80At: testbed.clock.now(),
      warned100At: testbed.clock.now(),
    });
  });

  it('asks for both emails when one report jumps past both thresholds', async () => {
    const workspaceId = testbed.ids.generate();

    await reporter.report(meteredReport(workspaceId, 12_000));

    expect((await thresholdEmailsQueued(testbed, workspaceId)).sort(byThreshold)).toEqual([
      UsageThreshold.Warn,
      UsageThreshold.Limit,
    ]);
  });

  it('measures the thresholds against the limit of the workspace', async () => {
    const workspaceId = testbed.ids.generate();
    await setWorkspaceLimits(testbed, workspaceId, { creditsLimit: 10 });

    await reporter.report(meteredReport(workspaceId, 8));

    expect(await thresholdEmailsQueued(testbed, workspaceId)).toEqual([UsageThreshold.Warn]);
  });

  it('never throws into the model call and counts the failure', async () => {
    const failures = testbed.module
      .get(MetricsService)
      .registry.getSingleMetric(UsageMetricName.ReportFailures);
    const before = (await failures?.get())?.values[0]?.value ?? 0;

    await expect(reporter.report(meteredReport('not-a-workspace', 1))).resolves.toBeUndefined();

    expect((await failures?.get())?.values[0]?.value).toBe(before + 1);
  });

  describe('through the LLM gateway', () => {
    let mock: MockLlmService;

    beforeAll(async () => {
      mock = await startMockLlm();
    });

    afterEach(() => {
      mock.reset();
    });

    afterAll(async () => {
      await mock.stop();
    });

    it('stores the credits of a platform call at the catalog price', async () => {
      const workspaceId = testbed.ids.generate();
      const gateway = createLlmGateway(
        { [EnvVar.LlmBaseUrl]: mock.url, [EnvVar.LlmApiKey]: 'test-llmapi-key' },
        TIMEOUTS,
        { usage: reporter },
      );
      mock.json({ intent: 'delivery' }, HAND_COMPUTED_ROUND);

      await gateway.complete({
        provider: { kind: LlmProviderKind.Platform },
        model: LlmModelId.Gpt6Luna,
        purpose: LlmPurpose.Conversation,
        system: 'You route customer messages.',
        messages: [{ role: LlmMessageRole.User, content: 'Do you deliver on Sundays?' }],
        output: z.object({ intent: z.string() }),
        tags: { traceName: 'route', workspaceId },
      });

      expect(await counterOf(testbed, workspaceId)).toMatchObject({
        credits: HAND_COMPUTED_CREDITS,
      });
    });
  });
});
