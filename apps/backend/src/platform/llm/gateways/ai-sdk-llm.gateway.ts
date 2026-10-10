import { Injectable } from '@nestjs/common';
import { generateText, zodSchema } from 'ai';
import type { ModelMessage } from 'ai';
import { LLM_CATALOG } from '@/platform/llm/constants/llm-catalog.constants';
import {
  LLM_NO_USAGE,
  LLM_OUTPUT_ATTEMPTS,
  LLM_SDK_MAX_RETRIES,
} from '@/platform/llm/constants/llm-gateway.constants';
import { LlmOutputInvalidError } from '@/platform/llm/errors/llm-output-invalid.error';
import { LlmGateway } from '@/platform/llm/gateways/llm.gateway';
import {
  addUsage,
  checkOutput,
  modelCallSettings,
  outputFeedbackMessage,
  outputInstructions,
  structuredOutput,
  toModelMessages,
} from '@/platform/llm/helpers/llm-gateway.helpers';
import { ProviderResolverService } from '@/platform/llm/services/provider-resolver.service';
import type {
  LlmCompleteRequest,
  LlmCompletion,
  LlmModelRun,
  LlmUsage,
} from '@/platform/llm/typedefs/llm-gateway.typedefs';

@Injectable()
export class AiSdkLlmGateway extends LlmGateway {
  constructor(private readonly providers: ProviderResolverService) {
    super();
  }

  async complete<T>(request: LlmCompleteRequest<T>): Promise<LlmCompletion<T>> {
    const run: LlmModelRun = {
      model: LLM_CATALOG[request.model],
      languageModel: this.providers.languageModel(request.provider, request.model),
      jsonSchema: await zodSchema(request.output).jsonSchema,
    };
    return this.completeAttempt(
      request,
      run,
      toModelMessages(request.messages),
      LLM_OUTPUT_ATTEMPTS,
      LLM_NO_USAGE,
    );
  }

  private async completeAttempt<T>(
    request: LlmCompleteRequest<T>,
    run: LlmModelRun,
    messages: readonly ModelMessage[],
    attemptsLeft: number,
    usage: LlmUsage,
  ): Promise<LlmCompletion<T>> {
    const result = await generateText({
      model: run.languageModel,
      instructions: outputInstructions(request.system, run.model, run.jsonSchema),
      messages: [...messages],
      output: structuredOutput(run.model, run.jsonSchema),
      maxRetries: LLM_SDK_MAX_RETRIES,
      ...modelCallSettings(run.model),
    });
    const spent = addUsage(usage, result.totalUsage);
    const checked = checkOutput(result.text, request.output);
    if (checked.success) {
      return { output: checked.data, model: run.model.id, usage: spent };
    }
    if (attemptsLeft <= 1) {
      throw new LlmOutputInvalidError(run.model.id, checked.error);
    }
    return this.completeAttempt(
      request,
      run,
      [...messages, ...result.response.messages, outputFeedbackMessage(checked.error)],
      attemptsLeft - 1,
      spent,
    );
  }
}
