import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type { OpenAICompatibleProvider } from '@ai-sdk/openai-compatible';
import { Injectable } from '@nestjs/common';
import type { LanguageModel } from 'ai';
import { ConfigService } from '@/platform/config/services/config.service';
import type { LlmModelId } from '@/platform/llm/constants/llm-model.constants';
import {
  LLM_PLATFORM_PROVIDER_NAME,
  LlmProviderKind,
} from '@/platform/llm/constants/llm-provider.constants';
import { LlmNotConfiguredError } from '@/platform/llm/errors/llm-not-configured.error';
import type { LlmProviderSource } from '@/platform/llm/typedefs/llm-provider.typedefs';

@Injectable()
export class ProviderResolverService {
  private readonly platform: OpenAICompatibleProvider | null;

  constructor(config: ConfigService) {
    const { baseUrl, apiKey } = config.config.llm;
    this.platform =
      apiKey === null
        ? null
        : createOpenAICompatible({ name: LLM_PLATFORM_PROVIDER_NAME, baseURL: baseUrl, apiKey });
  }

  languageModel(source: LlmProviderSource, model: LlmModelId): LanguageModel {
    if (source.kind === LlmProviderKind.Workspace || this.platform === null) {
      throw new LlmNotConfiguredError(source.kind);
    }
    return this.platform.chatModel(model);
  }
}
