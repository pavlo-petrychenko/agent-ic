import { LlmKeyVendor } from '@agent-ic/contracts';
import { HttpStatus } from '@nestjs/common';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { EnvVar } from '@/platform/config/constants/env.constants';
import { LLM_DEFAULT_MODEL } from '@/platform/llm/constants/llm-catalog.constants';
import {
  LLM_JSON_OBJECT_INSTRUCTION,
  LlmMessageRole,
} from '@/platform/llm/constants/llm-gateway.constants';
import {
  LlmCallOutcome,
  LlmMetricLabel,
  LlmMetricName,
  LlmOperation,
} from '@/platform/llm/constants/llm-metrics.constants';
import { LlmModelId, LlmPurpose } from '@/platform/llm/constants/llm-model.constants';
import { LlmProviderKind } from '@/platform/llm/constants/llm-provider.constants';
import { LLM_UNMETERED_CREDITS } from '@/platform/llm/constants/llm-usage.constants';
import { LlmUnavailableError } from '@/platform/llm/errors/llm-unavailable.error';
import type { AiSdkLlmGateway } from '@/platform/llm/gateways/ai-sdk-llm.gateway';
import type {
  LlmCompleteRequest,
  LlmStepTimeouts,
} from '@/platform/llm/typedefs/llm-gateway.typedefs';
import type { LlmWorkspaceKey } from '@/platform/llm/typedefs/llm-provider.typedefs';
import type { MetricsService } from '@/platform/observability/services/metrics.service';
import { MockLlmRoute } from '@test/support/constants/mock-llm.constants';
import { RecordingLlmKeyResolver } from '@test/support/fakes/recording-llm-key-resolver.fake';
import { RecordingUsageLimits } from '@test/support/fakes/recording-usage-limits.fake';
import { RecordingUsageReporter } from '@test/support/fakes/recording-usage-reporter.fake';
import { SamplePlanLimitError } from '@test/support/fixtures/sample-errors.fixture';
import {
  createLlmGateway,
  createLlmMetricsService,
  createMetricsService,
  metricValue,
} from '@test/support/helpers/llm-testing.helpers';
import { startMockLlm } from '@test/support/services/mock-llm.service';
import type { MockLlmService } from '@test/support/services/mock-llm.service';

const WORKSPACE_ID = 'ws_sources';
const PLATFORM_API_KEY = 'test-llmapi-key';
const CUSTOM_API_KEY = 'sk-custom-endpoint';
const CUSTOM_MODEL = 'acme/house-model-7b';
const CUSTOM_METRIC_MODEL = 'workspace:custom';
const KEY_ID = 'key-custom';
const KEY_WITH_FALLBACK_ID = 'key-custom-fallback';
const STEP_TIMEOUT_MS = 200;
const TIMEOUTS: LlmStepTimeouts = {
  [LlmPurpose.Conversation]: STEP_TIMEOUT_MS,
  [LlmPurpose.Light]: STEP_TIMEOUT_MS,
};
const DELIVERY = { intent: 'delivery' };
const ROUND = { promptTokens: 1_000, completionTokens: 200 };
const PLATFORM_DEFAULT = LLM_DEFAULT_MODEL[LlmPurpose.Conversation];

const output = z.object({ intent: z.enum(['delivery', 'other']) });

const customKey = (id: string, baseUrl: string, fallbackToPlatform: boolean): LlmWorkspaceKey => ({
  id,
  vendor: LlmKeyVendor.Custom,
  baseUrl,
  apiKey: CUSTOM_API_KEY,
  fallbackToPlatform,
});

const request = (
  provider: LlmCompleteRequest<unknown>['provider'],
  model: string,
): LlmCompleteRequest<z.infer<typeof output>> => ({
  provider,
  model,
  purpose: LlmPurpose.Conversation,
  system: 'You route customer messages.',
  messages: [{ role: LlmMessageRole.User, content: 'Do you deliver on Sundays?' }],
  output,
  tags: { traceName: 'route', workspaceId: WORKSPACE_ID },
});

const onKey = (providerKeyId: string) =>
  request(
    { kind: LlmProviderKind.Workspace, workspaceId: WORKSPACE_ID, providerKeyId },
    CUSTOM_MODEL,
  );

const onPlatform = () => request({ kind: LlmProviderKind.Platform }, LlmModelId.Ministral14b);

describe('AiSdkLlmGateway provider sources and usage limits', () => {
  let mock: MockLlmService;
  let keys: RecordingLlmKeyResolver;
  let limits: RecordingUsageLimits;
  let usage: RecordingUsageReporter;
  let metrics: MetricsService;
  let gateway: AiSdkLlmGateway;

  beforeAll(async () => {
    mock = await startMockLlm();
  });

  afterEach(() => {
    mock.reset();
  });

  afterAll(async () => {
    await mock.stop();
  });

  const startGateway = () => {
    keys = new RecordingLlmKeyResolver([
      customKey(KEY_ID, mock.url, false),
      customKey(KEY_WITH_FALLBACK_ID, mock.url, true),
    ]);
    limits = new RecordingUsageLimits();
    usage = new RecordingUsageReporter();
    metrics = createMetricsService();
    gateway = createLlmGateway(
      { [EnvVar.LlmBaseUrl]: mock.url, [EnvVar.LlmApiKey]: PLATFORM_API_KEY },
      TIMEOUTS,
      { keys, limits, usage, metrics: createLlmMetricsService(metrics) },
    );
  };

  it('answers a workspace call on its own key with the vendor profile, unmetered', async () => {
    startGateway();
    mock.json(DELIVERY, ROUND);

    const completion = await gateway.complete(onKey(KEY_ID));

    expect(completion).toMatchObject({ output: DELIVERY, model: CUSTOM_MODEL });
    expect(keys.lookups).toEqual([{ workspaceId: WORKSPACE_ID, providerKeyId: KEY_ID }]);
    expect(mock.requests[0]).toMatchObject({
      route: MockLlmRoute.ChatCompletions,
      authorization: `Bearer ${CUSTOM_API_KEY}`,
    });
    expect(mock.body(0)).toMatchObject({
      model: CUSTOM_MODEL,
      response_format: { type: 'json_object' },
    });
    expect(JSON.stringify(mock.body(0).messages)).toContain(LLM_JSON_OBJECT_INSTRUCTION);
    expect(usage.reports).toEqual([
      expect.objectContaining({
        source: LlmProviderKind.Workspace,
        model: CUSTOM_MODEL,
        credits: LLM_UNMETERED_CREDITS,
        metered: false,
      }),
    ]);
    expect(limits.checks).toEqual([]);
  });

  it('labels a workspace call in metrics by its vendor, not its model', async () => {
    startGateway();
    mock.json(DELIVERY);

    await gateway.complete(onKey(KEY_ID));

    expect(
      await metricValue(metrics, LlmMetricName.Calls, {
        [LlmMetricLabel.Operation]: LlmOperation.Complete,
        [LlmMetricLabel.Model]: CUSTOM_METRIC_MODEL,
        [LlmMetricLabel.Outcome]: LlmCallOutcome.Answered,
      }),
    ).toBe(1);
  });

  it('keeps answering a workspace call when the platform limit is reached', async () => {
    startGateway();
    limits.reach();
    mock.json(DELIVERY);

    const completion = await gateway.complete(onKey(KEY_ID));

    expect(completion.output).toEqual(DELIVERY);
    expect(limits.checks).toEqual([]);
  });

  it('does not fall back from a key whose fallback is off', async () => {
    startGateway();
    mock.fail(HttpStatus.SERVICE_UNAVAILABLE);

    const failure = gateway.complete(onKey(KEY_ID));

    await expect(failure).rejects.toBeInstanceOf(LlmUnavailableError);
    await expect(failure).rejects.toMatchObject({ details: { models: [CUSTOM_MODEL] } });
    expect(mock.requests).toHaveLength(1);
    expect(limits.checks).toEqual([]);
  });

  it('falls back once to the platform default model, checks the limit only there and meters it', async () => {
    startGateway();
    mock.fail(HttpStatus.SERVICE_UNAVAILABLE).json(DELIVERY, ROUND);

    const completion = await gateway.complete(onKey(KEY_WITH_FALLBACK_ID));

    expect(completion).toMatchObject({ output: DELIVERY, model: PLATFORM_DEFAULT });
    expect(mock.requests.map(({ authorization }) => authorization)).toEqual([
      `Bearer ${CUSTOM_API_KEY}`,
      `Bearer ${PLATFORM_API_KEY}`,
    ]);
    expect(mock.body(1).model).toBe(PLATFORM_DEFAULT);
    expect(limits.checks).toEqual([WORKSPACE_ID]);
    expect(usage.reports).toEqual([
      expect.objectContaining({
        source: LlmProviderKind.Platform,
        model: PLATFORM_DEFAULT,
        metered: true,
      }),
    ]);
    expect(
      await metricValue(metrics, LlmMetricName.Fallbacks, {
        [LlmMetricLabel.Model]: CUSTOM_METRIC_MODEL,
        [LlmMetricLabel.Fallback]: PLATFORM_DEFAULT,
      }),
    ).toBe(1);
  });

  it('stops the fallback hop at the platform limit instead of treating it as unavailable', async () => {
    startGateway();
    limits.reach();
    mock.fail(HttpStatus.SERVICE_UNAVAILABLE).json(DELIVERY);

    await expect(gateway.complete(onKey(KEY_WITH_FALLBACK_ID))).rejects.toBeInstanceOf(
      SamplePlanLimitError,
    );
    expect(mock.requests).toHaveLength(1);
  });

  it('refuses a platform call at the limit before the model is called', async () => {
    startGateway();
    limits.reach();

    await expect(gateway.complete(onPlatform())).rejects.toBeInstanceOf(SamplePlanLimitError);
    expect(mock.requests).toHaveLength(0);
    expect(limits.checks).toEqual([WORKSPACE_ID]);
  });

  it('checks the limit before each platform hop', async () => {
    startGateway();
    mock.fail(HttpStatus.SERVICE_UNAVAILABLE).json(DELIVERY);

    await gateway.complete(onPlatform());

    expect(limits.checks).toEqual([WORKSPACE_ID, WORKSPACE_ID]);
  });
});
