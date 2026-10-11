import { HttpStatus } from '@nestjs/common';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { EnvVar } from '@/platform/config/constants/env.constants';
import { LLM_CATALOG } from '@/platform/llm/constants/llm-catalog.constants';
import { LlmMessageRole } from '@/platform/llm/constants/llm-gateway.constants';
import {
  LlmCallOutcome,
  LlmMetricLabel,
  LlmMetricName,
  LlmOperation,
} from '@/platform/llm/constants/llm-metrics.constants';
import { LlmModelId, LlmPurpose } from '@/platform/llm/constants/llm-model.constants';
import { LlmProviderKind } from '@/platform/llm/constants/llm-provider.constants';
import { LlmUnavailableError } from '@/platform/llm/errors/llm-unavailable.error';
import type { AiSdkLlmGateway } from '@/platform/llm/gateways/ai-sdk-llm.gateway';
import type { LlmStepTimeouts } from '@/platform/llm/typedefs/llm-gateway.typedefs';
import type { MetricsService } from '@/platform/observability/services/metrics.service';
import { RecordingUsageReporter } from '@test/support/fakes/recording-usage-reporter.fake';
import {
  createLlmGateway,
  createLlmMetricsService,
  createMetricsService,
} from '@test/support/helpers/llm-testing.helpers';
import { startMockLlm } from '@test/support/services/mock-llm.service';
import type { MockLlmService } from '@test/support/services/mock-llm.service';

const WORKSPACE_ID = 'ws_usage';
const STEP_TIMEOUT_MS = 200;
const TIMEOUTS: LlmStepTimeouts = {
  [LlmPurpose.Conversation]: STEP_TIMEOUT_MS,
  [LlmPurpose.Light]: STEP_TIMEOUT_MS,
};
const PRIMARY = LlmModelId.Ministral14b;
const FALLBACK = LLM_CATALOG[PRIMARY].fallback;
const REPLY_TOOL_MODEL = LlmModelId.MimoV26Flash;
const DELIVERY = { intent: 'delivery' };
const FIRST_ROUND = { promptTokens: 1_000, completionTokens: 200 };
const SECOND_ROUND = { promptTokens: 1_500, completionTokens: 300 };
const FALLBACK_ROUND = { promptTokens: 2_000, completionTokens: 500 };
const MINISTRAL_FIRST_ROUND_CREDITS = 0.24;
const MINISTRAL_SECOND_ROUND_CREDITS = 0.36;
const MINISTRAL_BOTH_ROUNDS_CREDITS = 0.6;
const GEMMA_FALLBACK_ROUND_CREDITS = 0.46;

const output = z.object({ intent: z.enum(['delivery', 'other']) });

const completeRequest = (model: LlmModelId = PRIMARY) => ({
  provider: { kind: LlmProviderKind.Platform } as const,
  model,
  purpose: LlmPurpose.Conversation,
  system: 'You route customer messages.',
  messages: [{ role: LlmMessageRole.User, content: 'Do you deliver on Sundays?' }],
  output,
  tags: { traceName: 'route', workspaceId: WORKSPACE_ID },
});

const agentRequest = (model: LlmModelId = PRIMARY) => ({
  ...completeRequest(model),
  tools: {
    lookup: {
      description: 'Look up the delivery days',
      inputSchema: z.object({ day: z.string() }),
      execute: async () => ({ delivers: true }),
    },
  },
  maxToolRounds: 4,
});

const meteredReport = (model: LlmModelId, round: typeof FIRST_ROUND, credits: number) => ({
  workspaceId: WORKSPACE_ID,
  source: LlmProviderKind.Platform,
  model,
  inputTokens: round.promptTokens,
  outputTokens: round.completionTokens,
  credits: expect.closeTo(credits),
  metered: true,
});

const metricValue = async (
  metrics: MetricsService,
  name: LlmMetricName,
  labels: Readonly<Record<string, string>>,
): Promise<number | null> => {
  const metric = await metrics.registry.getSingleMetric(name)?.get();
  const sample = metric?.values.find((value) =>
    Object.entries(labels).every(([label, wanted]) => value.labels[label] === wanted),
  );
  return sample?.value ?? null;
};

describe('AiSdkLlmGateway usage and metrics', () => {
  let mock: MockLlmService;
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
    usage = new RecordingUsageReporter();
    metrics = createMetricsService();
    gateway = createLlmGateway(
      { [EnvVar.LlmBaseUrl]: mock.url, [EnvVar.LlmApiKey]: 'test-llmapi-key' },
      TIMEOUTS,
      { usage, metrics: createLlmMetricsService(metrics) },
    );
  };

  it('reports every model call with credits from the price table', async () => {
    startGateway();
    mock.json({ intent: 'weather' }, FIRST_ROUND).json(DELIVERY, SECOND_ROUND);

    await gateway.complete(completeRequest());

    expect(usage.reports).toEqual([
      meteredReport(PRIMARY, FIRST_ROUND, MINISTRAL_FIRST_ROUND_CREDITS),
      meteredReport(PRIMARY, SECOND_ROUND, MINISTRAL_SECOND_ROUND_CREDITS),
    ]);
    expect(
      await metricValue(metrics, LlmMetricName.OutputRetries, { [LlmMetricLabel.Model]: PRIMARY }),
    ).toBe(1);
  });

  it('reports the tokens of every tool round in one agent call', async () => {
    startGateway();
    mock.toolCall('lookup', { day: 'sunday' }, FIRST_ROUND).json(DELIVERY, SECOND_ROUND);

    await gateway.runAgent(agentRequest());

    expect(usage.reports).toEqual([
      meteredReport(
        PRIMARY,
        {
          promptTokens: FIRST_ROUND.promptTokens + SECOND_ROUND.promptTokens,
          completionTokens: FIRST_ROUND.completionTokens + SECOND_ROUND.completionTokens,
        },
        MINISTRAL_BOTH_ROUNDS_CREDITS,
      ),
    ]);
  });

  it('reports the fallback model at its own price and counts the fallback', async () => {
    startGateway();
    mock.fail(HttpStatus.INTERNAL_SERVER_ERROR).json(DELIVERY, FALLBACK_ROUND);

    await gateway.complete(completeRequest());

    expect(usage.reports).toEqual([
      meteredReport(FALLBACK, FALLBACK_ROUND, GEMMA_FALLBACK_ROUND_CREDITS),
    ]);
    expect(
      await metricValue(metrics, LlmMetricName.Fallbacks, {
        [LlmMetricLabel.Model]: PRIMARY,
        [LlmMetricLabel.Fallback]: FALLBACK,
      }),
    ).toBe(1);
  });

  it('counts a reply-tool nudge', async () => {
    startGateway();
    mock.text('We deliver on Sundays.').reply(DELIVERY);

    await gateway.runAgent(agentRequest(REPLY_TOOL_MODEL));

    expect(usage.reports).toHaveLength(2);
    expect(
      await metricValue(metrics, LlmMetricName.ReplyNudges, {
        [LlmMetricLabel.Model]: REPLY_TOOL_MODEL,
      }),
    ).toBe(1);
  });

  it('counts and times answered and failed calls', async () => {
    startGateway();
    mock.json(DELIVERY).fail(HttpStatus.SERVICE_UNAVAILABLE).hang();

    await gateway.runAgent(agentRequest());
    await expect(gateway.complete(completeRequest())).rejects.toBeInstanceOf(LlmUnavailableError);

    const answered = {
      [LlmMetricLabel.Operation]: LlmOperation.Agent,
      [LlmMetricLabel.Model]: PRIMARY,
      [LlmMetricLabel.Outcome]: LlmCallOutcome.Answered,
    };
    const failed = {
      [LlmMetricLabel.Operation]: LlmOperation.Complete,
      [LlmMetricLabel.Model]: PRIMARY,
      [LlmMetricLabel.Outcome]: LlmCallOutcome.Failed,
    };
    expect(await metricValue(metrics, LlmMetricName.Calls, answered)).toBe(1);
    expect(await metricValue(metrics, LlmMetricName.Calls, failed)).toBe(1);
    expect(await metrics.render()).toContain(`${LlmMetricName.CallDuration}_count`);
  });

  it('registers every LLM metric', () => {
    startGateway();

    for (const name of Object.values(LlmMetricName)) {
      expect(metrics.registry.getSingleMetric(name)).toBeDefined();
    }
  });
});
