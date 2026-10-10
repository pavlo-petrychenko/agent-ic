import { LlmProviderKind } from '@/platform/llm/constants/llm-provider.constants';
import {
  LLM_TOKENS_PER_PRICE_UNIT,
  LLM_UNMETERED_CREDITS,
  LLM_USD_PER_CREDIT,
} from '@/platform/llm/constants/llm-usage.constants';
import type { LlmUsage } from '@/platform/llm/typedefs/llm-gateway.typedefs';
import type { LlmModel } from '@/platform/llm/typedefs/llm-model.typedefs';
import type { LlmProviderSource } from '@/platform/llm/typedefs/llm-provider.typedefs';
import type { LlmTags } from '@/platform/llm/typedefs/llm-tracing.typedefs';
import type { LlmUsageReport } from '@/platform/llm/typedefs/llm-usage.typedefs';

export const creditsFor = ({ price }: LlmModel, usage: LlmUsage): number =>
  (usage.inputTokens * price.inputUsdPerMillionTokens +
    usage.outputTokens * price.outputUsdPerMillionTokens) /
  (LLM_TOKENS_PER_PRICE_UNIT * LLM_USD_PER_CREDIT);

export const usageReport = (
  provider: LlmProviderSource,
  tags: LlmTags,
  model: LlmModel,
  usage: LlmUsage,
): LlmUsageReport => {
  const metered = provider.kind === LlmProviderKind.Platform;
  return {
    workspaceId: tags.workspaceId,
    source: provider.kind,
    model: model.id,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    credits: metered ? creditsFor(model, usage) : LLM_UNMETERED_CREDITS,
    metered,
  };
};
