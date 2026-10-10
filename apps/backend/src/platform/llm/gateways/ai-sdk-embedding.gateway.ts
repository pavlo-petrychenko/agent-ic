import { Inject, Injectable } from '@nestjs/common';
import { embedMany } from 'ai';
import type { EmbeddingModel, EmbedManyResult } from 'ai';
import {
  EMBEDDING_BATCH_TIMEOUT,
  EMBEDDING_FIRST_HOP,
  EMBEDDING_OUTPUT_TOKENS,
} from '@/platform/llm/constants/embedding-gateway.constants';
import { EMBEDDING_CATALOG } from '@/platform/llm/constants/llm-catalog.constants';
import { LLM_SDK_MAX_RETRIES } from '@/platform/llm/constants/llm-gateway.constants';
import { LlmOperation } from '@/platform/llm/constants/llm-metrics.constants';
import { LlmProviderKind } from '@/platform/llm/constants/llm-provider.constants';
import { EmbeddingDimensionMismatchError } from '@/platform/llm/errors/embedding-dimension-mismatch.error';
import { LlmUnavailableError } from '@/platform/llm/errors/llm-unavailable.error';
import { EmbeddingGateway } from '@/platform/llm/gateways/embedding.gateway';
import { toBatches } from '@/platform/llm/helpers/embedding-gateway.helpers';
import { isModelUnavailable, toUpstreamFailure } from '@/platform/llm/helpers/llm-gateway.helpers';
import { usageReport } from '@/platform/llm/helpers/llm-usage.helpers';
import { LlmMetricsService } from '@/platform/llm/services/llm-metrics.service';
import { LlmTraceContextService } from '@/platform/llm/services/llm-trace-context.service';
import { ProviderResolverService } from '@/platform/llm/services/provider-resolver.service';
import { UsageReporter } from '@/platform/llm/services/usage-reporter.service';
import type {
  EmbeddingResult,
  EmbedOptions,
} from '@/platform/llm/typedefs/embedding-gateway.typedefs';
import type { LlmEmbeddingModel } from '@/platform/llm/typedefs/llm-model.typedefs';
import type { LlmTags } from '@/platform/llm/typedefs/llm-tracing.typedefs';

@Injectable()
export class AiSdkEmbeddingGateway extends EmbeddingGateway {
  constructor(
    private readonly providers: ProviderResolverService,
    private readonly traces: LlmTraceContextService,
    private readonly usage: UsageReporter,
    private readonly metrics: LlmMetricsService,
    @Inject(EMBEDDING_BATCH_TIMEOUT) private readonly batchTimeoutMs: number,
  ) {
    super();
  }

  async embed(texts: readonly string[], { model, tags }: EmbedOptions): Promise<EmbeddingResult> {
    const entry = EMBEDDING_CATALOG[model];
    return this.traces.forCall(() =>
      this.metrics.measure(LlmOperation.Embed, model, async () => {
        const embeddingModel = this.providers.embeddingModel(model);
        const vectors: number[][] = [];
        let tokens = 0;
        for (const batch of toBatches(texts, entry.batchSize)) {
          const result = await this.embedBatch(entry, embeddingModel, batch, tags);
          vectors.push(...result.embeddings);
          tokens += result.usage.tokens;
        }
        return { vectors, model, dimensions: entry.dimensions, tokens };
      }),
    );
  }

  private async embedBatch(
    entry: LlmEmbeddingModel,
    embeddingModel: EmbeddingModel,
    values: string[],
    tags: LlmTags,
  ): Promise<EmbedManyResult> {
    const result = await this.callModel(entry, embeddingModel, values, tags);
    await this.usage.report(
      usageReport({ kind: LlmProviderKind.Platform }, tags, entry, {
        inputTokens: result.usage.tokens,
        outputTokens: EMBEDDING_OUTPUT_TOKENS,
      }),
    );
    const wrong = result.embeddings.find((vector) => vector.length !== entry.dimensions);
    if (wrong !== undefined) {
      throw new EmbeddingDimensionMismatchError(entry.id, entry.dimensions, wrong.length);
    }
    return result;
  }

  private async callModel(
    entry: LlmEmbeddingModel,
    embeddingModel: EmbeddingModel,
    values: string[],
    tags: LlmTags,
  ): Promise<EmbedManyResult> {
    try {
      return await embedMany({
        model: embeddingModel,
        values,
        dimensions: entry.dimensions,
        maxRetries: LLM_SDK_MAX_RETRIES,
        abortSignal: AbortSignal.timeout(this.batchTimeoutMs),
        telemetry: this.traces.callTelemetry(tags, {
          model: entry.id,
          fallbackHop: EMBEDDING_FIRST_HOP,
          reasoning: null,
        }),
      });
    } catch (error) {
      throw isModelUnavailable(error)
        ? new LlmUnavailableError([entry.id], [error])
        : toUpstreamFailure(error);
    }
  }
}
