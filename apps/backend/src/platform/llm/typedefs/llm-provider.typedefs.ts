import type { LlmKeyVendor } from '@agent-ic/contracts';
import type { EmbeddingModel, LanguageModel } from 'ai';
import type { EmbeddingModelId, LlmApi } from '@/platform/llm/constants/llm-model.constants';
import type { LlmProviderKind } from '@/platform/llm/constants/llm-provider.constants';

export type LlmProviderSource =
  | { readonly kind: LlmProviderKind.Platform }
  | {
      readonly kind: LlmProviderKind.Workspace;
      readonly workspaceId: string;
      readonly providerKeyId: string;
    };

export interface LlmWorkspaceKey {
  readonly id: string;
  readonly vendor: LlmKeyVendor;
  readonly baseUrl: string | null;
  readonly apiKey: string;
  readonly fallbackToPlatform: boolean;
}

export type LlmResolvedSource =
  | { readonly kind: LlmProviderKind.Platform }
  | { readonly kind: LlmProviderKind.Workspace; readonly key: LlmWorkspaceKey };

export interface LlmModelHop {
  readonly source: LlmResolvedSource;
  readonly model: string;
}

export type LlmPlatformModels = Readonly<Record<LlmApi, (model: string) => LanguageModel>>;

export type LlmPlatformEmbeddings = (model: EmbeddingModelId) => EmbeddingModel;
