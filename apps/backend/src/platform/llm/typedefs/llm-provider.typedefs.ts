import type { EmbeddingModel, LanguageModel } from 'ai';
import type {
  EmbeddingModelId,
  LlmApi,
  LlmModelId,
} from '@/platform/llm/constants/llm-model.constants';
import type { LlmProviderKind } from '@/platform/llm/constants/llm-provider.constants';

export type LlmProviderSource =
  | { readonly kind: LlmProviderKind.Platform }
  | { readonly kind: LlmProviderKind.Workspace; readonly workspaceId: string };

export type LlmPlatformModels = Readonly<Record<LlmApi, (model: LlmModelId) => LanguageModel>>;

export type LlmPlatformEmbeddings = (model: EmbeddingModelId) => EmbeddingModel;
