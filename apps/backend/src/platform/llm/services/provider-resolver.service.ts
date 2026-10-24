import { Inject, Injectable } from '@nestjs/common';
import type { EmbeddingModel, LanguageModel } from 'ai';
import { ConfigService } from '@/platform/config/services/config.service';
import type { EmbeddingModelId } from '@/platform/llm/constants/llm-model.constants';
import {
  LLM_PLATFORM_SOURCE,
  LlmProviderKind,
} from '@/platform/llm/constants/llm-provider.constants';
import { LlmNotConfiguredError } from '@/platform/llm/errors/llm-not-configured.error';
import {
  platformEmbeddings,
  platformModels,
  workspaceLanguageModel,
} from '@/platform/llm/helpers/llm-provider.helpers';
import { LlmKeyResolver } from '@/platform/llm/services/llm-key-resolver.service';
import type { LlmModelProfile } from '@/platform/llm/typedefs/llm-model.typedefs';
import type {
  LlmPlatformEmbeddings,
  LlmPlatformModels,
  LlmProviderSource,
  LlmResolvedSource,
} from '@/platform/llm/typedefs/llm-provider.typedefs';
import { OUTBOUND_GUARDED_FETCH } from '@/platform/outbound-http/constants/outbound-http.constants';

@Injectable()
export class ProviderResolverService {
  private readonly platform: LlmPlatformModels | null;
  private readonly embeddings: LlmPlatformEmbeddings | null;

  constructor(
    config: ConfigService,
    private readonly keys: LlmKeyResolver,
    @Inject(OUTBOUND_GUARDED_FETCH) private readonly guardedFetch: typeof fetch,
  ) {
    const { baseUrl, apiKey } = config.config.llm;
    this.platform = apiKey === null ? null : platformModels(baseUrl, apiKey);
    this.embeddings = apiKey === null ? null : platformEmbeddings(baseUrl, apiKey);
  }

  async resolve(source: LlmProviderSource): Promise<LlmResolvedSource> {
    if (source.kind === LlmProviderKind.Platform) {
      return LLM_PLATFORM_SOURCE;
    }
    return {
      kind: LlmProviderKind.Workspace,
      key: await this.keys.resolve(source.workspaceId, source.providerKeyId),
    };
  }

  languageModel(source: LlmResolvedSource, profile: LlmModelProfile): LanguageModel {
    if (source.kind === LlmProviderKind.Workspace) {
      return workspaceLanguageModel(source.key, profile.id, this.guardedFetch);
    }
    if (this.platform === null) {
      throw new LlmNotConfiguredError(LlmProviderKind.Platform);
    }
    return this.platform[profile.api](profile.id);
  }

  embeddingModel(model: EmbeddingModelId): EmbeddingModel {
    if (this.embeddings === null) {
      throw new LlmNotConfiguredError(LlmProviderKind.Platform);
    }
    return this.embeddings(model);
  }
}
