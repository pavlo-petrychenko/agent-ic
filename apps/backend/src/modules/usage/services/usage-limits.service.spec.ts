import { ErrorReason, LlmKeyVendor } from '@agent-ic/contracts';
import { HttpStatus } from '@nestjs/common';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { UsageLimitReachedError } from '@/modules/usage/errors/usage-limit-reached.error';
import { EnvVar } from '@/platform/config/constants/env.constants';
import { LimitScope } from '@/platform/errors/constants/domain-error.constants';
import { JobFailureAction } from '@/platform/errors/constants/job-failure.constants';
import { jobFailureActionFor } from '@/platform/errors/helpers/job-failure.helpers';
import { LlmMessageRole } from '@/platform/llm/constants/llm-gateway.constants';
import { LlmModelId, LlmPurpose } from '@/platform/llm/constants/llm-model.constants';
import { LlmProviderKind } from '@/platform/llm/constants/llm-provider.constants';
import type { AiSdkLlmGateway } from '@/platform/llm/gateways/ai-sdk-llm.gateway';
import { UsageLimits } from '@/platform/llm/services/usage-limits.service';
import { UsageReporter } from '@/platform/llm/services/usage-reporter.service';
import type {
  LlmCompleteRequest,
  LlmStepTimeouts,
} from '@/platform/llm/typedefs/llm-gateway.typedefs';
import {
  TEST_CREDITS_LIMIT,
  USAGE_TEST_MONTH_MS,
  USAGE_TEST_PERIOD_END,
} from '@test/support/constants/usage-testing.constants';
import { RecordingLlmKeyResolver } from '@test/support/fakes/recording-llm-key-resolver.fake';
import { createLlmGateway } from '@test/support/helpers/llm-testing.helpers';
import {
  createUsageTestbed,
  meteredReport,
  setWorkspaceLimits,
} from '@test/support/helpers/usage-testing.helpers';
import { startMockLlm } from '@test/support/services/mock-llm.service';
import type { MockLlmService } from '@test/support/services/mock-llm.service';
import type { UsageTestbed } from '@test/support/typedefs/usage-testing.typedefs';

const STEP_TIMEOUT_MS = 1_000;
const TIMEOUTS: LlmStepTimeouts = {
  [LlmPurpose.Conversation]: STEP_TIMEOUT_MS,
  [LlmPurpose.Light]: STEP_TIMEOUT_MS,
};
const KEY_ID = 'key-with-fallback';
const DELIVERY = { intent: 'delivery' };
const output = z.object({ intent: z.string() });

describe('UsageLimitsService', () => {
  let testbed: UsageTestbed;
  let limits: UsageLimits;
  let reporter: UsageReporter;

  beforeAll(async () => {
    testbed = await createUsageTestbed();
    limits = testbed.module.get(UsageLimits);
    reporter = testbed.module.get(UsageReporter);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  const reachLimit = (workspaceId: string, credits: number = TEST_CREDITS_LIMIT) =>
    reporter.report(meteredReport(workspaceId, credits));

  it('allows platform calls below the credit limit', async () => {
    const workspaceId = testbed.ids.generate();
    await reachLimit(workspaceId, TEST_CREDITS_LIMIT - 1);

    await expect(limits.assertPlatformCallAllowed(workspaceId)).resolves.toBeUndefined();
  });

  it('allows a workspace with no usage this month', async () => {
    await expect(limits.assertPlatformCallAllowed(testbed.ids.generate())).resolves.toBeUndefined();
  });

  it('refuses at the credit limit with a plan limit that ends with the month', async () => {
    const workspaceId = testbed.ids.generate();
    await reachLimit(workspaceId);

    const refusal = limits.assertPlatformCallAllowed(workspaceId);

    await expect(refusal).rejects.toBeInstanceOf(UsageLimitReachedError);
    await expect(refusal).rejects.toMatchObject({
      reason: ErrorReason.UsageLimitReached,
      scope: LimitScope.Plan,
      details: { periodEnd: USAGE_TEST_PERIOD_END.toISOString() },
    });
  });

  it('makes the job give up instead of retrying', () => {
    expect(jobFailureActionFor(new UsageLimitReachedError(USAGE_TEST_PERIOD_END))).toBe(
      JobFailureAction.GiveUp,
    );
  });

  it('uses the workspace override over the configured limit', async () => {
    const raised = testbed.ids.generate();
    const lowered = testbed.ids.generate();
    await setWorkspaceLimits(testbed, raised, { creditsLimit: TEST_CREDITS_LIMIT * 2 });
    await setWorkspaceLimits(testbed, lowered, { creditsLimit: 5 });
    await reachLimit(raised);
    await reachLimit(lowered, 5);

    await expect(limits.assertPlatformCallAllowed(raised)).resolves.toBeUndefined();
    await expect(limits.assertPlatformCallAllowed(lowered)).rejects.toBeInstanceOf(
      UsageLimitReachedError,
    );
  });

  it('keeps the configured limit when the override leaves credits empty', async () => {
    const workspaceId = testbed.ids.generate();
    await setWorkspaceLimits(testbed, workspaceId, { conversationsLimit: 5 });
    await reachLimit(workspaceId);

    await expect(limits.assertPlatformCallAllowed(workspaceId)).rejects.toBeInstanceOf(
      UsageLimitReachedError,
    );
  });

  it('allows platform calls again in the next month', async () => {
    const workspaceId = testbed.ids.generate();
    await reachLimit(workspaceId);
    testbed.clock.advanceBy(USAGE_TEST_MONTH_MS);

    const check = limits.assertPlatformCallAllowed(workspaceId);

    await expect(check).resolves.toBeUndefined();
    testbed.clock.advanceBy(-USAGE_TEST_MONTH_MS);
  });

  describe('in the LLM gateway', () => {
    let mock: MockLlmService;
    let gateway: AiSdkLlmGateway;

    beforeAll(async () => {
      mock = await startMockLlm();
      gateway = createLlmGateway(
        { [EnvVar.LlmBaseUrl]: mock.url, [EnvVar.LlmApiKey]: 'test-llmapi-key' },
        TIMEOUTS,
        {
          limits,
          usage: reporter,
          keys: new RecordingLlmKeyResolver([
            {
              id: KEY_ID,
              vendor: LlmKeyVendor.Custom,
              baseUrl: mock.url,
              apiKey: 'sk-custom',
              fallbackToPlatform: true,
            },
          ]),
        },
      );
    });

    afterEach(() => {
      mock.reset();
    });

    afterAll(async () => {
      await mock.stop();
    });

    const request = (
      workspaceId: string,
      provider: LlmCompleteRequest<unknown>['provider'],
      model: string,
    ): LlmCompleteRequest<z.infer<typeof output>> => ({
      provider,
      model,
      purpose: LlmPurpose.Conversation,
      system: 'You route customer messages.',
      messages: [{ role: LlmMessageRole.User, content: 'Do you deliver on Sundays?' }],
      output,
      tags: { traceName: 'route', workspaceId },
    });

    const onPlatform = (workspaceId: string) =>
      request(workspaceId, { kind: LlmProviderKind.Platform }, LlmModelId.Ministral14b);

    const onKey = (workspaceId: string) =>
      request(
        workspaceId,
        { kind: LlmProviderKind.Workspace, workspaceId, providerKeyId: KEY_ID },
        'acme/house-model',
      );

    it('refuses a platform call at the limit before the model is called', async () => {
      const workspaceId = testbed.ids.generate();
      await reachLimit(workspaceId);

      await expect(gateway.complete(onPlatform(workspaceId))).rejects.toBeInstanceOf(
        UsageLimitReachedError,
      );
      expect(mock.requests).toHaveLength(0);
    });

    it('keeps answering on the workspace key at the limit', async () => {
      const workspaceId = testbed.ids.generate();
      await reachLimit(workspaceId);
      mock.json(DELIVERY);

      const completion = await gateway.complete(onKey(workspaceId));

      expect(completion.output).toEqual(DELIVERY);
    });

    it('stops the platform fallback hop of a key at the limit', async () => {
      const workspaceId = testbed.ids.generate();
      await reachLimit(workspaceId);
      mock.fail(HttpStatus.SERVICE_UNAVAILABLE).json(DELIVERY);

      await expect(gateway.complete(onKey(workspaceId))).rejects.toBeInstanceOf(
        UsageLimitReachedError,
      );
      expect(mock.requests).toHaveLength(1);
    });
  });
});
