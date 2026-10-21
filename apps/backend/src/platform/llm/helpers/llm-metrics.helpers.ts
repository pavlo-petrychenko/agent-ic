import {
  LLM_METRIC_MODEL_SEPARATOR,
  LLM_WORKSPACE_METRIC_MODEL_PREFIX,
} from '@/platform/llm/constants/llm-metrics.constants';
import { LlmProviderKind } from '@/platform/llm/constants/llm-provider.constants';
import type { LlmResolvedSource } from '@/platform/llm/typedefs/llm-provider.typedefs';

export const metricModelLabel = (source: LlmResolvedSource, model: string): string =>
  source.kind === LlmProviderKind.Platform
    ? model
    : `${LLM_WORKSPACE_METRIC_MODEL_PREFIX}${LLM_METRIC_MODEL_SEPARATOR}${source.key.vendor}`;
