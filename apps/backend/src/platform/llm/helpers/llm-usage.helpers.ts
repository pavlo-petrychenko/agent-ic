import { LlmProviderKind } from '@/platform/llm/constants/llm-provider.constants';
import {
  LLM_TOKENS_PER_PRICE_UNIT,
  LLM_UNMETERED_CREDITS,
  LLM_USD_PER_CREDIT,
} from '@/platform/llm/constants/llm-usage.constants';
import type { LlmUsage } from '@/platform/llm/typedefs/llm-gateway.typedefs';
import type { LlmPrice, LlmPricedModel } from '@/platform/llm/typedefs/llm-model.typedefs';
import type { LlmResolvedSource } from '@/platform/llm/typedefs/llm-provider.typedefs';
import type { LlmTags } from '@/platform/llm/typedefs/llm-tracing.typedefs';
import type { LlmUsageReport } from '@/platform/llm/typedefs/llm-usage.typedefs';

export const creditsFor = (price: LlmPrice | null, usage: LlmUsage): number =>
  price === null
    ? LLM_UNMETERED_CREDITS
    : (usage.inputTokens * price.inputUsdPerMillionTokens +
        usage.outputTokens * price.outputUsdPerMillionTokens) /
      (LLM_TOKENS_PER_PRICE_UNIT * LLM_USD_PER_CREDIT);

export const usageReport = (
  source: LlmResolvedSource,
  tags: LlmTags,
  model: LlmPricedModel,
  usage: LlmUsage,
): LlmUsageReport => {
  const metered = source.kind === LlmProviderKind.Platform;
  return {
    workspaceId: tags.workspaceId,
    source: source.kind,
    model: model.id,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    credits: metered ? creditsFor(model.price, usage) : LLM_UNMETERED_CREDITS,
    metered,
  };
};
