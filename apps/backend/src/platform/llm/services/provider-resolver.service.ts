import { Injectable } from '@nestjs/common';
import type { EmbeddingModel, LanguageModel } from 'ai';
import { ConfigService } from '@/platform/config/services/config.service';
import { LLM_CATALOG } from '@/platform/llm/constants/llm-catalog.constants';
import type { EmbeddingModelId, LlmModelId } from '@/platform/llm/constants/llm-model.constants';
import { LlmProviderKind } from '@/platform/llm/constants/llm-provider.constants';
import { LlmNotConfiguredError } from '@/platform/llm/errors/llm-not-configured.error';
import { platformEmbeddings, platformModels } from '@/platform/llm/helpers/llm-provider.helpers';
import type {
  LlmPlatformEmbeddings,
  LlmPlatformModels,
  LlmProviderSource,
} from '@/platform/llm/typedefs/llm-provider.typedefs';

@Injectable()
export class ProviderResolverService {
  private readonly platform: LlmPlatformModels | null;
  private readonly embeddings: LlmPlatformEmbeddings | null;

  constructor(config: ConfigService) {
    const { baseUrl, apiKey } = config.config.llm;
    this.platform = apiKey === null ? null : platformModels(baseUrl, apiKey);
    this.embeddings = apiKey === null ? null : platformEmbeddings(baseUrl, apiKey);
  }

  languageModel(source: LlmProviderSource, model: LlmModelId): LanguageModel {
    if (source.kind === LlmProviderKind.Workspace || this.platform === null) {
      throw new LlmNotConfiguredError(source.kind);
    }
    return this.platform[LLM_CATALOG[model].api](model);
  }

  embeddingModel(model: EmbeddingModelId): EmbeddingModel {
    if (this.embeddings === null) {
      throw new LlmNotConfiguredError(LlmProviderKind.Platform);
    }
    return this.embeddings(model);
  }
}
