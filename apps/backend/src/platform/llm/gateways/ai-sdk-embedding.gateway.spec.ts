import { HttpStatus } from '@nestjs/common';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { EnvVar } from '@/platform/config/constants/env.constants';
import { UpstreamError } from '@/platform/errors/errors/upstream.error';
import { EMBEDDING_CATALOG } from '@/platform/llm/constants/llm-catalog.constants';
import {
  LlmCallOutcome,
  LlmMetricLabel,
  LlmMetricName,
  LlmOperation,
} from '@/platform/llm/constants/llm-metrics.constants';
import { EmbeddingModelId } from '@/platform/llm/constants/llm-model.constants';
import { LlmProviderKind } from '@/platform/llm/constants/llm-provider.constants';
import { EmbeddingDimensionMismatchError } from '@/platform/llm/errors/embedding-dimension-mismatch.error';
import { LlmNotConfiguredError } from '@/platform/llm/errors/llm-not-configured.error';
import { LlmUnavailableError } from '@/platform/llm/errors/llm-unavailable.error';
import type { AiSdkEmbeddingGateway } from '@/platform/llm/gateways/ai-sdk-embedding.gateway';
import type { MetricsService } from '@/platform/observability/services/metrics.service';
import { MockLlmRoute } from '@test/support/constants/mock-llm.constants';
import { RecordingUsageReporter } from '@test/support/fakes/recording-usage-reporter.fake';
import {
  createEmbeddingGateway,
  createLlmMetricsService,
  createMetricsService,
  metricValue,
} from '@test/support/helpers/llm-testing.helpers';
import { mockEmbedding } from '@test/support/helpers/mock-llm.helpers';
import { startMockLlm } from '@test/support/services/mock-llm.service';
import type { MockLlmService } from '@test/support/services/mock-llm.service';

const WORKSPACE_ID = 'ws_embed';
const BATCH_TIMEOUT_MS = 200;
const MODEL = EmbeddingModelId.JinaEmbeddingsV5TextSmall;
const { batchSize: BATCH_SIZE, dimensions: DIMENSIONS } = EMBEDDING_CATALOG[MODEL];
const EXTRA_TEXTS = 2;
const WRONG_DIMENSIONS = 512;
const FULL_BATCH_CREDITS = 0.00256;
const SHORT_BATCH_CREDITS = 0.00004;
const OPTIONS = { model: MODEL, tags: { traceName: 'kb-ingest', workspaceId: WORKSPACE_ID } };

const textsOf = (count: number): string[] =>
  Array.from({ length: count }, (_, index) => `chunk ${index}`);

const meteredReport = (tokens: number, credits: number) => ({
  workspaceId: WORKSPACE_ID,
  source: LlmProviderKind.Platform,
  model: MODEL,
  inputTokens: tokens,
  outputTokens: 0,
  credits: expect.closeTo(credits),
  metered: true,
});

describe('AiSdkEmbeddingGateway', () => {
  let mock: MockLlmService;
  let usage: RecordingUsageReporter;
  let metrics: MetricsService;
  let gateway: AiSdkEmbeddingGateway;

  beforeAll(async () => {
    mock = await startMockLlm();
  });

  afterEach(() => {
    mock.reset();
  });

  afterAll(async () => {
    await mock.stop();
  });

  const startGateway = (apiKey = 'test-llmapi-key') => {
    usage = new RecordingUsageReporter();
    metrics = createMetricsService();
    gateway = createEmbeddingGateway(
      { [EnvVar.LlmBaseUrl]: mock.url, [EnvVar.LlmApiKey]: apiKey },
      BATCH_TIMEOUT_MS,
      { usage, metrics: createLlmMetricsService(metrics) },
    );
  };

  it('embeds texts in batches of the catalog size and keeps their order', async () => {
    startGateway();
    mock.embed().embed();

    const result = await gateway.embed(textsOf(BATCH_SIZE + EXTRA_TEXTS), OPTIONS);

    expect(mock.requests.map(({ route }) => route)).toEqual([
      MockLlmRoute.Embeddings,
      MockLlmRoute.Embeddings,
    ]);
    expect(mock.body(0)).toMatchObject({ model: MODEL, dimensions: DIMENSIONS });
    expect(mock.body(0).input).toEqual(textsOf(BATCH_SIZE));
    expect(mock.body(1).input).toEqual(textsOf(BATCH_SIZE + EXTRA_TEXTS).slice(BATCH_SIZE));
    expect(result).toEqual({
      vectors: [
        ...textsOf(BATCH_SIZE).map((_, index) => mockEmbedding(index, DIMENSIONS)),
        ...textsOf(EXTRA_TEXTS).map((_, index) => mockEmbedding(index, DIMENSIONS)),
      ],
      model: MODEL,
      dimensions: DIMENSIONS,
      tokens: BATCH_SIZE + EXTRA_TEXTS,
    });
  });

  it('reports the usage of every batch with credits from the price table', async () => {
    startGateway();
    mock.embed().embed();

    await gateway.embed(textsOf(BATCH_SIZE + EXTRA_TEXTS), OPTIONS);

    expect(usage.reports).toEqual([
      meteredReport(BATCH_SIZE, FULL_BATCH_CREDITS),
      meteredReport(EXTRA_TEXTS, SHORT_BATCH_CREDITS),
    ]);
  });

  it('calls nothing for no texts', async () => {
    startGateway();

    const result = await gateway.embed([], OPTIONS);

    expect(result.vectors).toEqual([]);
    expect(mock.requests).toEqual([]);
  });

  it('throws a typed error on vectors of the wrong size, after reporting usage', async () => {
    startGateway();
    mock.embed(WRONG_DIMENSIONS);

    const failure = gateway.embed(textsOf(EXTRA_TEXTS), OPTIONS);

    await expect(failure).rejects.toBeInstanceOf(EmbeddingDimensionMismatchError);
    await expect(failure).rejects.toMatchObject({
      details: { model: MODEL, expected: DIMENSIONS, received: WRONG_DIMENSIONS },
    });
    expect(usage.reports).toEqual([meteredReport(EXTRA_TEXTS, SHORT_BATCH_CREDITS)]);
  });

  it.each([
    ['a 5xx', (mock: MockLlmService) => mock.fail(HttpStatus.SERVICE_UNAVAILABLE)],
    ['a rate limit', (mock: MockLlmService) => mock.fail(HttpStatus.TOO_MANY_REQUESTS)],
    ['a timeout', (mock: MockLlmService) => mock.hang()],
  ])('reports the model unavailable on %s', async (_name, script) => {
    startGateway();
    script(mock);

    await expect(gateway.embed(textsOf(EXTRA_TEXTS), OPTIONS)).rejects.toBeInstanceOf(
      LlmUnavailableError,
    );
    expect(usage.reports).toEqual([]);
  });

  it('turns a rejected request into a non-retryable upstream failure', async () => {
    startGateway();
    mock.fail(HttpStatus.BAD_REQUEST);

    await expect(gateway.embed(textsOf(EXTRA_TEXTS), OPTIONS)).rejects.toMatchObject({
      constructor: UpstreamError,
      retryable: false,
    });
  });

  it('refuses to embed without the platform key', async () => {
    startGateway('');

    await expect(gateway.embed(textsOf(EXTRA_TEXTS), OPTIONS)).rejects.toBeInstanceOf(
      LlmNotConfiguredError,
    );
  });

  it('counts answered and failed embed calls', async () => {
    startGateway();
    mock.embed().fail(HttpStatus.SERVICE_UNAVAILABLE);

    await gateway.embed(textsOf(EXTRA_TEXTS), OPTIONS);
    await expect(gateway.embed(textsOf(EXTRA_TEXTS), OPTIONS)).rejects.toBeInstanceOf(
      LlmUnavailableError,
    );

    for (const outcome of [LlmCallOutcome.Answered, LlmCallOutcome.Failed]) {
      expect(
        await metricValue(metrics, LlmMetricName.Calls, {
          [LlmMetricLabel.Operation]: LlmOperation.Embed,
          [LlmMetricLabel.Model]: MODEL,
          [LlmMetricLabel.Outcome]: outcome,
        }),
      ).toBe(1);
    }
  });
});
