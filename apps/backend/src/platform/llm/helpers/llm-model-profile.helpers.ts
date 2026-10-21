import type { LlmKeyVendor } from '@agent-ic/contracts';
import { LLM_CATALOG } from '@/platform/llm/constants/llm-catalog.constants';
import type { LlmModelId } from '@/platform/llm/constants/llm-model.constants';
import { LlmProviderKind } from '@/platform/llm/constants/llm-provider.constants';
import {
  LLM_MODEL_PATH_SEPARATOR,
  LLM_VENDOR_PROFILE,
} from '@/platform/llm/constants/llm-vendor-profile.constants';
import { LlmModelUnknownError } from '@/platform/llm/errors/llm-model-unknown.error';
import type { LlmModelProfile } from '@/platform/llm/typedefs/llm-model.typedefs';
import type { LlmResolvedSource } from '@/platform/llm/typedefs/llm-provider.typedefs';

export const isLlmModelId = (model: string): model is LlmModelId =>
  Object.hasOwn(LLM_CATALOG, model);

const lastSegment = (model: string): string =>
  model.slice(model.lastIndexOf(LLM_MODEL_PATH_SEPARATOR) + 1);

export const workspaceProfile = (vendor: LlmKeyVendor, model: string): LlmModelProfile => {
  const defaults = LLM_VENDOR_PROFILE[vendor];
  const known = Object.values(LLM_CATALOG).find(
    (entry) =>
      entry.vendor === defaults.vendor &&
      (entry.id === model || lastSegment(entry.id) === lastSegment(model)),
  );
  if (known === undefined) {
    return { ...defaults, id: model, label: model };
  }
  return {
    id: model,
    label: known.label,
    vendor: known.vendor,
    api: known.api,
    structuredOutput: known.structuredOutput,
    agentFinish: known.agentFinish,
    reasoningLevels: known.reasoningLevels,
    reasoningEffort: known.reasoningEffort,
    price: known.price,
    fallback: null,
  };
};

export const profileFor = (source: LlmResolvedSource, model: string): LlmModelProfile => {
  if (source.kind === LlmProviderKind.Workspace) {
    return workspaceProfile(source.key.vendor, model);
  }
  if (!isLlmModelId(model)) {
    throw new LlmModelUnknownError(model);
  }
  return LLM_CATALOG[model];
};
