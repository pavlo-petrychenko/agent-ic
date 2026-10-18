import type { LlmCatalogQuery } from '@/features/settings/communication/gql/query/llmCatalog.generated';
import { LLM_VENDOR_ORDER } from '@/features/settings/constants/llmKey.constants';
import type { LlmProviderModels } from '@/features/settings/typedefs/llmKey.typedefs';
import { ModelSource } from '@/shared/api/generated/schema.generated';
import type { ModelPurpose, ModelVendor } from '@/shared/api/generated/schema.generated';

export const toLlmProviders = (data: LlmCatalogQuery | undefined): readonly LlmProviderModels[] => {
  const counts = new Map<ModelVendor, number>(LLM_VENDOR_ORDER.map((vendor) => [vendor, 0]));
  for (const option of data?.modelOptions ?? []) {
    counts.set(option.vendor, (counts.get(option.vendor) ?? 0) + 1);
  }
  return LLM_VENDOR_ORDER.map((vendor) => ({ vendor, modelCount: counts.get(vendor) ?? 0 }));
};

export const toPlatformPurposes = (data: LlmCatalogQuery | undefined): readonly ModelPurpose[] => {
  const purposes = (data?.modelOptions ?? [])
    .filter((option) => option.source === ModelSource.Platform)
    .flatMap((option) => option.purposes);
  return [...new Set(purposes)];
};
