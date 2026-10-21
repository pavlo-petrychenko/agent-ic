import type { LlmKeyCheckStatus } from '@/features/settings/constants/llmKey.constants';
import type { LlmKeyVendor, ModelPurpose } from '@/shared/api/generated/schema.generated';

export interface LlmKey {
  readonly id: string;
  readonly vendor: LlmKeyVendor;
  readonly name: string;
  readonly baseUrl: string | null;
  readonly keyLast4: string;
  readonly fallbackToPlatform: boolean;
  readonly addedBy: string;
  readonly createdAt: string;
  readonly usedBySteps: number;
}

export interface LlmKeyDraft {
  readonly vendor: LlmKeyVendor;
  readonly name: string;
  readonly baseUrl: string;
  readonly apiKey: string;
  readonly fallbackToPlatform: boolean;
}

export type LlmKeyCheckState =
  | { readonly status: LlmKeyCheckStatus.Idle }
  | { readonly status: LlmKeyCheckStatus.Checking }
  | { readonly status: LlmKeyCheckStatus.Ok; readonly models: readonly string[] }
  | { readonly status: LlmKeyCheckStatus.Failed; readonly message: string };

export interface LlmKeyCheckOutcome {
  readonly checkId: string;
  readonly state: LlmKeyCheckState;
}

export interface LlmKeyCheckInput {
  readonly vendor: LlmKeyVendor;
  readonly apiKey: string;
  readonly baseUrl: string | null;
}

export interface UseLlmKeysResult {
  readonly keys: readonly LlmKey[];
  readonly loading: boolean;
  readonly failed: boolean;
  readonly retry: () => void;
}

export interface UseLlmCatalogResult {
  readonly purposes: readonly ModelPurpose[];
  readonly loading: boolean;
}
