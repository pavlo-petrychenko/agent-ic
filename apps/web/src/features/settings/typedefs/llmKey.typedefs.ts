import type { ModelPurpose, ModelVendor } from '@/shared/api/generated/schema.generated';

export interface LlmKey {
  readonly vendor: ModelVendor;
  readonly last4: string;
  readonly usedBySteps: number;
}

export interface LlmProviderModels {
  readonly vendor: ModelVendor;
  readonly modelCount: number;
}

export interface UseLlmCatalogResult {
  readonly providers: readonly LlmProviderModels[];
  readonly purposes: readonly ModelPurpose[];
  readonly loading: boolean;
}
